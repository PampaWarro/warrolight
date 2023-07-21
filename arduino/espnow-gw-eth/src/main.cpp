#include <Arduino.h>
#include <AsyncUDP.h>
#include <ESPNOWPixels.h>
#include <ESPmDNS.h>
#include <ETH.h>
#include <WarroUDP.h>
#include <esp_now.h>
#include <esp_wifi.h>

#include <atomic>
#include <condition_variable>
#include <memory>
#include <mutex>
#include <string_view>

// Valid range [8, 84], corresponding to 2dBm - 20dBm.
// https://github.com/espressif/arduino-esp32/blob/bcc1d758fc343887de03affeedfbb33522ff2523/tools/sdk/esp32c3/include/esp_wifi/include/esp_wifi.h#L905
static constexpr int8_t kWifiMaxTxPower = 84;
#ifndef WIFI_CHANNEL
#define WIFI_CHANNEL 1
#endif
static constexpr int kChannel = WIFI_CHANNEL;
static constexpr uint8_t kBroadcastAddress[]{0xff, 0xff, 0xff,
                                             0xff, 0xff, 0xff};
static constexpr size_t kMacAddressLength =
    sizeof(kBroadcastAddress) / sizeof(uint8_t);

#ifndef UDP_PORT
#define UDP_PORT 6677
#endif
static constexpr uint16_t kUdpPort = UDP_PORT;

#ifndef NUM_CLIENTS
#define NUM_CLIENTS 6
#endif
static constexpr size_t kNumClients = NUM_CLIENTS;
#ifndef LEDS_PER_CLIENT
#define LEDS_PER_CLIENT 300
#endif
static constexpr size_t kLedsPerClient = LEDS_PER_CLIENT;
static constexpr size_t kNumLeds = kNumClients * kLedsPerClient;

#ifdef HOSTNAME
#define XSTR(s) STR(s)
#define STR(s) #s
static constexpr std::string_view kHostname = XSTR(HOSTNAME);
#undef STR
#undef XSTR
#else
static constexpr std::string_view kHostname = "espnow-gw";
#endif

static constexpr size_t kEspNowMaxPendingPackets = 20;
static constexpr wifi_phy_rate_t kWifiPhyRate = WIFI_PHY_RATE_5M_L;
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
std::atomic<size_t> in_frame_count = 0;
std::atomic<unsigned long> last_frame_millis = 0;
std::condition_variable cv;

void onNewFrame(const CRGB* pixels, size_t length) {
  auto frame = std::make_unique<std::vector<CRGB>>(pixels, pixels + length);
  {
    std::lock_guard lock(mutex);
    new_frame = std::move(frame);
  }
  cv.notify_one();
  last_frame_millis = millis();
  ++in_frame_count;
}

WarroChunkedUDP warroUDP(kNumLeds, onNewFrame);

void handleWiFiEvent(WiFiEvent_t event) {
  switch (event) {
    case ARDUINO_EVENT_ETH_START:
      Serial.println("ETH Started");
      break;
    case ARDUINO_EVENT_ETH_CONNECTED:
      Serial.println("ETH Connected");
      break;
    case ARDUINO_EVENT_ETH_GOT_IP:
      Serial.print("ETH MAC: ");
      Serial.print(ETH.macAddress());
      Serial.print(", IPv4: ");
      Serial.print(ETH.localIP());
      if (ETH.fullDuplex()) {
        Serial.print(", FULL_DUPLEX");
      }
      Serial.print(", ");
      Serial.print(ETH.linkSpeed());
      Serial.println("Mbps");
      Serial.print("Hostname: ");
      Serial.println(kHostname.data());
      break;
    case ARDUINO_EVENT_ETH_DISCONNECTED:
      Serial.println("ETH Disconnected");
      break;
    case ARDUINO_EVENT_ETH_STOP:
      Serial.println("ETH Stopped");
      break;
    default:
      break;
  }
}

void handleUdpPacket(AsyncUDPPacket& packet) {
  warroUDP.handlePacket(packet.data(), packet.length());
}

std::atomic<size_t> out_frame_count = 0;
TaskHandle_t espNowSenderTaskHandle;
ESPNOWSender espNowSender(kLedsPerClient, kNumClients);
SemaphoreHandle_t espNowSemaphore = NULL;

bool espNowSend(const uint8_t* data, size_t length) {
  TRUE_OR_RESTART(xSemaphoreTake(espNowSemaphore, portMAX_DELAY) == pdTRUE);
  ESP_OK_OR_RESTART(esp_now_send(kBroadcastAddress, data, length));
  return true;
}

void espNowSenderTask(void*) {
  for (;;) {
    std::unique_lock lk(mutex);
    cv.wait(lk, [] { return new_frame != nullptr; });
    auto pixels = std::move(new_frame);
    lk.unlock();
    TRUE_OR_RESTART(pixels != nullptr);
    TRUE_OR_RESTART(
        espNowSender.send(pixels->data(), pixels->size(), espNowSend));
    ++out_frame_count;
  }
}

void espNowSendCallback(const uint8_t* mac_addr, esp_now_send_status_t status) {
  TRUE_OR_RESTART(xSemaphoreGive(espNowSemaphore) == pdTRUE);
}

std::optional<unsigned long> last_fps_millis;
static const unsigned long start_ms = millis();

void broadcastWarroUDPStatus(TimerHandle_t xTimer) {
  const auto now = millis();
  const bool connection_timeout =
      now - last_frame_millis > kConnectionTimeoutMillis;
  if (connection_timeout) {
    warroUDP.broadcastAlive(broadcastUdp);
  }
  auto in_count = in_frame_count.exchange(0);
  auto out_count = out_frame_count.exchange(0);
  if (last_fps_millis) {
    size_t in_fps =
        round(static_cast<float>(1000 * in_count) / (now - *last_fps_millis));
    size_t out_fps =
        round(static_cast<float>(1000 * out_count) / (now - *last_fps_millis));
    if (!connection_timeout) {
      warroUDP.broadcastFps(out_fps, broadcastUdp);
    }
    Serial.print("FPS: in=");
    Serial.print(in_fps);
    Serial.print(" out=");
    Serial.println(out_fps);
  }
  last_fps_millis = now;
}

void setup() {
  Serial.begin(460800);
  Serial.println();
  Serial.println("Warrolight ESP-NOW Gateway");

  espNowSemaphore = xSemaphoreCreateCounting(kEspNowMaxPendingPackets,
                                             kEspNowMaxPendingPackets);

  Serial.println("Initializing ETH... ");
  WiFi.onEvent(handleWiFiEvent);
  udp.onPacket(handleUdpPacket);
  TRUE_OR_RESTART(ETH.begin());
  TRUE_OR_RESTART(ETH.setHostname(kHostname.data()));
  TRUE_OR_RESTART(MDNS.begin(kHostname.data()));
  TRUE_OR_RESTART(udp.listen(kUdpPort));

  Serial.println("Initializing ESP-NOW...");
  wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();

  ESP_OK_OR_RESTART(esp_wifi_init(&cfg));
  ESP_OK_OR_RESTART(
      esp_wifi_set_country_code("US", /*ieee80211d_enabled=*/false));
  ESP_OK_OR_RESTART(esp_wifi_set_storage(WIFI_STORAGE_RAM));
  ESP_OK_OR_RESTART(esp_wifi_set_mode(WIFI_MODE_STA));
  ESP_OK_OR_RESTART(esp_wifi_start());

  ESP_OK_OR_RESTART(esp_wifi_set_channel(kChannel, WIFI_SECOND_CHAN_NONE));
  uint8_t primary_channel;
  wifi_second_chan_t second_channel;
  ESP_OK_OR_RESTART(esp_wifi_get_channel(&primary_channel, &second_channel));
  Serial.print("Transmitting on channel: ");
  Serial.println(primary_channel);
  int8_t power;
  ESP_OK_OR_RESTART(esp_wifi_set_max_tx_power(kWifiMaxTxPower));
  ESP_OK_OR_RESTART(esp_wifi_get_max_tx_power(&power));
  Serial.print("Power: ");
  Serial.print(.25 * power);
  Serial.println(" dBm");

  ESP_OK_OR_RESTART(esp_wifi_config_espnow_rate(
      (wifi_interface_t)ESP_IF_WIFI_STA, kWifiPhyRate));
  ESP_OK_OR_RESTART(esp_now_init());
  ESP_OK_OR_RESTART(esp_now_register_send_cb(espNowSendCallback));
  esp_now_peer_info_t peer;
  memset(&peer, 0, sizeof(esp_now_peer_info_t));
  peer.channel = kChannel;
  peer.ifidx = (wifi_interface_t)ESP_IF_WIFI_STA;
  peer.encrypt = false;
  memcpy(peer.peer_addr, kBroadcastAddress, kMacAddressLength);
  ESP_OK_OR_RESTART(esp_now_add_peer(&peer));

  // Run ESP-NOW sender task on the core that's not used by UDP.
  xTaskCreatePinnedToCore(
      espNowSenderTask, "esp-now-sender", 10000, nullptr,
      uxTaskPriorityGet(NULL), &espNowSenderTaskHandle,
      /*core_id=*/(CONFIG_ARDUINO_UDP_RUNNING_CORE + 1) % 2);

  TimerHandle_t warroUDPStatusTimer =
      xTimerCreate("WarroUDPStatus", pdMS_TO_TICKS(1000),
                   /*auto_reload=*/pdTRUE,
                   /*id=*/nullptr, broadcastWarroUDPStatus);
  TRUE_OR_RESTART(xTimerStart(warroUDPStatusTimer, 0) == pdPASS);

  TimerHandle_t espNowBeaconTimer =
      xTimerCreate("ESP-NOW Beacon", pdMS_TO_TICKS(250),
                   /*auto_reload=*/pdTRUE,
                   /*id=*/nullptr, [](TimerHandle_t xTimer) {
                     espNowSender.sendBeacon(kHostname, espNowSend);
                   });
  TRUE_OR_RESTART(xTimerStart(espNowBeaconTimer, 0) == pdPASS);

  TimerHandle_t uptimeTimer =
      xTimerCreate("Uptime", pdMS_TO_TICKS(60 * 1000),
                   /*auto_reload=*/pdTRUE,
                   /*id=*/nullptr, [](TimerHandle_t xTimer) {
                     espNowSender.sendBeacon(kHostname, espNowSend);
                     const auto uptime_s = (millis() - start_ms) / 1000;
                     const auto uptime_m = uptime_s / 60;
                     const auto uptime_h = uptime_m / 60;
                     Serial.print("Uptime: ");
                     Serial.print(uptime_h % 60);
                     Serial.print("h ");
                     Serial.print(uptime_m % 60);
                     Serial.print("m ");
                     Serial.print(uptime_s % 60);
                     Serial.println("s.");
                   });
  TRUE_OR_RESTART(xTimerStart(uptimeTimer, 0) == pdPASS);

  Serial.println("Ready!");
}

void loop() {}
