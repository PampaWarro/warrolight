#define FASTLED_ESP32_I2S true
#include <FastLED.h>
//

#include <Arduino.h>
#include <AsyncUDP.h>
#include <ESPmDNS.h>
#include <ETH.h>
#include <WarroUDP.h>

#include <atomic>
#include <condition_variable>>
#include <memory>
#include <mutex>
#include <string_view>

#ifndef UDP_PORT
#define UDP_PORT 6677
#endif
static constexpr uint16_t kUdpPort = UDP_PORT;

#ifndef LED_PINS
#define LED_PINS 16
#endif
static constexpr std::array<uint8_t, 4> kPins{LED_PINS};
#ifndef LEDS_PER_PIN
#define LEDS_PER_PIN 300
#endif
static constexpr size_t kNumLedsPerPin = LEDS_PER_PIN;
static constexpr size_t kNumLeds = kPins.size() * kNumLedsPerPin;
CRGB leds[kNumLeds];

#ifdef HOSTNAME
#define XSTR(s) STR(s)
#define STR(s) #s
static constexpr std::string_view kHostname = XSTR(HOSTNAME);
#undef STR
#undef XSTR
#else
static constexpr std::string_view kHostname = "esp32-eth";
#endif

// At least 1000, which is the broadcast alive interval.
static constexpr unsigned long kConnectionTimeoutMillis = 1000 + 500;

#define TRUE_OR_RESTART(x)           \
  do {                               \
    if (!(x)) {                      \
      Serial.println("Failed: " #x); \
      ESP.restart();                 \
    }                                \
  } while (0)

#define ESP_OK_OR_RESTART(x)                   \
  do {                                         \
    if (auto status = (x); status != ESP_OK) { \
      Serial.println("Failed: " #x);           \
      ESP_ERROR_CHECK_WITHOUT_ABORT(status);   \
      ESP.restart();                           \
    }                                          \
  } while (0)

AsyncUDP udp;

bool broadcastUdp(const uint8_t* data, size_t length) {
  udp.broadcastTo(const_cast<uint8_t*>(data), length, kUdpPort);
  return true;
}

std::mutex mutex;
std::unique_ptr<std::vector<CRGB>> new_frame = nullptr;
std::optional<unsigned long> last_frame_millis = std::nullopt;
std::condition_variable cv;

void onNewFrame(const CRGB* pixels, size_t length) {
  auto frame = std::make_unique<std::vector<CRGB>>(
      pixels, pixels + std::min(length, kNumLeds));
  if (length != kNumLeds) {
    // Paint last pixel red (overflow) or yellow (underflow).
    frame->at(frame->size() - 1) = length > kNumLeds ? CRGB::Red : CRGB::Green;
  }
  {
    std::lock_guard lock(mutex);
    new_frame = std::move(frame);
  }
  cv.notify_one();
  last_frame_millis = millis();
}

WarroChunkedUDP warroUDP(kNumLeds, onNewFrame);

void handleWiFiEvent(WiFiEvent_t event) {
  switch (event) {
    case ARDUINO_EVENT_ETH_START:
      ETH.setHostname(kHostname.data());
      break;
    case ARDUINO_EVENT_ETH_CONNECTED:
      break;
    case ARDUINO_EVENT_ETH_GOT_IP:
      TRUE_OR_RESTART(udp.listen(kUdpPort));
      TRUE_OR_RESTART(MDNS.begin(kHostname.data()));
      warroUDP.broadcastAlive(broadcastUdp);
      break;
    case ARDUINO_EVENT_ETH_DISCONNECTED:
      MDNS.end();
      udp.close();
      break;
    case ARDUINO_EVENT_ETH_STOP:
      break;
    default:
      break;
  }
}

void handleUdpPacket(AsyncUDPPacket& packet) {
  warroUDP.handlePacket(packet.data(), packet.length());
}

std::optional<unsigned long> last_fps_millis;
static const unsigned long start_ms = millis();
std::atomic<size_t> frame_count = 0;

void broadcastWarroUDPStatus(TimerHandle_t xTimer) {
  const auto now = millis();
  const bool connection_timeout =
      !last_frame_millis || now - *last_frame_millis > kConnectionTimeoutMillis;
  if (connection_timeout) {
    warroUDP.broadcastAlive(broadcastUdp);
  }
  auto count = frame_count.exchange(0);
  if (last_fps_millis) {
    size_t fps =
        round(static_cast<float>(1000 * count) / (now - *last_fps_millis));
    if (!connection_timeout) {
      warroUDP.broadcastFps(fps, broadcastUdp);
    }
  }
  last_fps_millis = now;
}

template <uint8_t... pins, size_t... index>
void addLedsImpl(std::index_sequence<index...>) {
  (FastLED.addLeds<WS2812B, pins, GRB>(leds, index * kNumLedsPerPin,
                                       kNumLedsPerPin),
   ...);
}

template <uint8_t... pins>
void addLeds() {
  addLedsImpl<pins...>(std::make_index_sequence<sizeof...(pins)>{});
}

TaskHandle_t renderTaskHandle;
std::atomic<bool> has_new_frame = false;
void renderTask(void*) {
  for (;;) {
    std::unique_lock lk(mutex);
    cv.wait(lk, [] { return new_frame != nullptr; });
    auto pixels = std::move(new_frame);
    lk.unlock();
    TRUE_OR_RESTART(pixels != nullptr);
    std::copy(pixels->begin(), pixels->end(), leds);
    has_new_frame = true;
  }
}

void setup() {
  addLeds<LED_PINS>();
  FastLED.setDither(DISABLE_DITHER);
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 4000);
  std::fill(leds, leds + kNumLeds, CRGB::Black);
  FastLED.show();

  WiFi.onEvent(handleWiFiEvent);
  udp.onPacket(handleUdpPacket);
  TRUE_OR_RESTART(ETH.begin());

  TimerHandle_t warroUDPStatusTimer =
      xTimerCreate("WarroUDPStatus", pdMS_TO_TICKS(1000),
                   /*auto_reload=*/pdTRUE,
                   /*id=*/nullptr, broadcastWarroUDPStatus);
  TRUE_OR_RESTART(xTimerStart(warroUDPStatusTimer, 0) == pdPASS);

  // Run render task on the core that's not used by UDP.
  xTaskCreatePinnedToCore(
      renderTask, "render", 10000, nullptr, uxTaskPriorityGet(NULL),
      &renderTaskHandle,
      /*core_id=*/(CONFIG_ARDUINO_UDP_RUNNING_CORE + 1) % 2);
}

void loop() {
  if (has_new_frame.exchange(false)) {
    FastLED.show();
    ++frame_count;
  } else if (!last_frame_millis || millis() - *last_frame_millis > 1000) {
    fadeToBlackBy(leds, kNumLeds, 1);
    uint8_t dothue = 0;
    for (int i = 0; i < 4; i++) {
      leds[(5 * (10 + i) * (30000 + millis()) / 1000) % kNumLeds] |=
          CHSV(dothue, 200, 255);
      dothue += 64;
    }
    for (size_t i = 0; i < kPins.size(); ++i) {
      for (size_t j = 0; j <= i; ++j) {
        leds[i * kNumLedsPerPin + j] = CRGB::Red;
      }
    }
    FastLED.show();
  }
}
