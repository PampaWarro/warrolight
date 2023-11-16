#include <Arduino.h>
#include <ESPNOWPixels.h>
#include <FastLED.h>
#include <WifiEspNow.h>

#if defined(ARDUINO_ARCH_ESP32)
#include <esp_wifi.h>
#endif

#include <algorithm>
#include <cmath>
#include <iterator>
#include <memory>
#if defined(ARDUINO_ARCH_ESP32)
#include <mutex>
#endif
#include <optional>
#include <string>
#include <string_view>
#include <vector>

#if defined(ARDUINO_ARCH_ESP8266)
#define DATA_PIN D4
#elif defined(ARDUINO_ARCH_ESP32)
#define DATA_PIN 13
#endif

#define TRUE_OR_RESTART(x)           \
  do {                               \
    if (!x) {                        \
      Serial.println("Failed: " #x); \
      ESP.restart();                 \
    }                                \
  } while (0)

#ifndef CLIENT
#define CLIENT 0
#endif
static constexpr uint8_t kClient = CLIENT;

#ifndef WIFI_CHANNEL
#define WIFI_CHANNEL 1
#endif
static constexpr int kChannel = WIFI_CHANNEL;

#ifndef NUM_LEDS
#define NUM_LEDS 300
#endif
static constexpr size_t kNumLeds = NUM_LEDS;

#ifdef GATEWAY_HOSTNAME
#define XSTR(s) STR(s)
#define STR(s) #s
static constexpr std::string_view kGatewayHostname = XSTR(GATEWAY_HOSTNAME);
#undef STR
#undef XSTR
#else
static constexpr std::string_view kGatewayHostname = "espnow-gw";
#endif

CRGB leds[kNumLeds];
#if defined(ARDUINO_ARCH_ESP32)
std::mutex mutex;
#endif
std::unique_ptr<std::vector<CRGB>> latest_frame = nullptr;

bool handleNewFrame(const CRGB* pixels, size_t length) {
  auto new_frame = std::make_unique<std::vector<CRGB>>(pixels, pixels + length);
  {
#if defined(ARDUINO_ARCH_ESP32)
    std::lock_guard lock(mutex);
#endif
    latest_frame = std::move(new_frame);
  }
  return true;
}

ESPNOWReceiver espNowReceiver(kGatewayHostname, kNumLeds, CLIENT,
                              handleNewFrame);

void handleMessage(const uint8_t mac[WIFIESPNOW_ALEN], const uint8_t* buf,
                   size_t count, void* arg) {
  espNowReceiver.handlePacket(mac, buf, count);
}

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("Warrolight ESP-NOW Client");

  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, kNumLeds);
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 200);
  FastLED.setDither(DISABLE_DITHER);
  std::fill(leds, leds + kNumLeds, CRGB::Black);
  FastLED.show();

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WiFi.softAPmacAddress().c_str(), "", kChannel, /*bssid=*/nullptr,
             /*connect=*/false);
#if defined(ARDUINO_ARCH_ESP32)
  esp_wifi_set_channel(kChannel, WIFI_SECOND_CHAN_NONE);
#endif
  WiFi.disconnect(/*wifioff=*/false);

  Serial.print("MAC address of this node is ");
  Serial.println(WiFi.softAPmacAddress());
  Serial.print("WiFi channel is ");
  Serial.println(WiFi.channel());

  WifiEspNow.onReceive(handleMessage, nullptr);

  TRUE_OR_RESTART(WifiEspNow.begin());
}

size_t frame_count = 0;
std::optional<unsigned long> last_frame_millis;
std::optional<unsigned long> last_non_black_frame_millis;
bool connected = false;

void loop() {
  EVERY_N_SECONDS(10) {
    auto stats = espNowReceiver.popStats();
    Serial.print("In=");
    Serial.print(stats.message_count);
    Serial.print(" packets, expected ");
    const auto expected_message_count =
        stats.message_count + stats.missed_message_count;
    Serial.print(expected_message_count);
    Serial.print(" (loss: ");
    Serial.print(100. * static_cast<float>(stats.missed_message_count) /
                 (expected_message_count));
    Serial.print("%), out=");
    Serial.print(frame_count);
    Serial.println(" frames.");
    frame_count = 0;
  }
  std::unique_ptr<std::vector<CRGB>> new_frame = nullptr;
  {
#if defined(ARDUINO_ARCH_ESP32)
    std::lock_guard lock(mutex);
#endif
    new_frame = std::move(latest_frame);
  }
  bool draw_fallback = false;
  if (new_frame) {
    if (!connected) {
      Serial.println("Connected.");
      connected = true;
    }
    const auto now = millis();
    last_frame_millis = now;
    ++frame_count;
    bool all_black = true;
    for (size_t i = 0; i < new_frame->size(); ++i) {
      const CRGB& color = new_frame->at(i);
      leds[i] = color;
      if (all_black && (color.r != 0 || color.g != 0 || color.b != 0)) {
        all_black = false;
      }
    }
    if (!all_black) {
      last_non_black_frame_millis = now;
    }
    const bool non_black_timeout =
        !last_non_black_frame_millis ||
        millis() - *last_non_black_frame_millis > 10000;
    if (non_black_timeout) {
      draw_fallback = true;
    } else {
      FastLED.show();
    }
  }
  const bool connection_timeout =
      !last_frame_millis || millis() - *last_frame_millis > 1000;
  if (connection_timeout) {
    draw_fallback = true;
    if (connected) {
      Serial.println(
          "Connection timeout. Falling back to built-in "
          "animation.");
      connected = false;
    }
  }
  if (draw_fallback) {
    EVERY_N_MILLIS(5) {
      fadeToBlackBy(leds, kNumLeds, 8);
      uint16_t value = beatsin8(10, 1, 80);
      leds[0].b = value * value / 255;
      leds[1].b = leds[0].b / 2;
      leds[2].b = leds[1].b / 2;
      FastLED.show();
    }
  }
}
