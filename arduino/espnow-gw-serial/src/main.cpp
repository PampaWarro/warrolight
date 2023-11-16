#include <Arduino.h>
#include <ESPNOWPixels.h>
#include <Warrolight.h>
#include <esp_now.h>
#include <esp_wifi.h>


// Valid range [8, 84], corresponding to 2dBm - 20dBm.
// https://github.com/espressif/arduino-esp32/blob/bcc1d758fc343887de03affeedfbb33522ff2523/tools/sdk/esp32c3/include/esp_wifi/include/esp_wifi.h#L905
static constexpr int8_t kWifiMaxTxPower = 84;
static constexpr int kChannel = 1;
static constexpr uint8_t kBroadcastAddress[]{0xff, 0xff, 0xff,
                                             0xff, 0xff, 0xff};
static constexpr size_t kMacAddressLength = sizeof(kBroadcastAddress) / sizeof(uint8_t);
static constexpr wifi_phy_rate_t kWifiPhyRate = WIFI_PHY_RATE_5M_L;

WSerial wserial;
static constexpr size_t kNumLeds = 300;
CRGB leds[kNumLeds];
ESPNOWSender espNowSender(kNumLeds, 1);

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("Warrolight ESP-NOW Gateway");

  Serial.println("Initializing ESP-NOW...");
  wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
  esp_wifi_init(&cfg);
  esp_wifi_set_country_code("US", /*ieee80211d_enabled=*/false);
  esp_wifi_set_storage(WIFI_STORAGE_RAM);
  esp_wifi_set_mode(WIFI_MODE_STA);
  esp_wifi_start();
  esp_wifi_set_channel(kChannel, WIFI_SECOND_CHAN_NONE);
  uint8_t primary_channel;
  wifi_second_chan_t second_channel;
  esp_wifi_get_channel(&primary_channel, &second_channel);
  Serial.print("Transmitting on channel: ");
  Serial.println(primary_channel);
  int8_t power;
  esp_wifi_set_max_tx_power(kWifiMaxTxPower);
  esp_wifi_get_max_tx_power(&power);
  Serial.print("Power: ");
  Serial.print(.25 * power);
  Serial.println(" dBm");

  esp_wifi_config_espnow_rate((wifi_interface_t)ESP_IF_WIFI_STA, kWifiPhyRate);
  esp_now_init();
  // esp_now_register_send_cb(espNowSendCallback);
  esp_now_peer_info_t peer;
  memset(&peer, 0, sizeof(esp_now_peer_info_t));
  peer.channel = kChannel;
  peer.ifidx = (wifi_interface_t)ESP_IF_WIFI_STA;
  peer.encrypt = false;
  memcpy(peer.peer_addr, kBroadcastAddress, kMacAddressLength);
  esp_now_add_peer(&peer);

  for (size_t i = 0; i < kNumLeds; i++) {
    leds[i] = CRGB::Black;
  }

  leds[0].r = 255;
  leds[1].r = 200;
  leds[2].r = 100;
  Serial.println("Ready!");
  // espNowSender.send(leds, kNumLeds, nullptr);
}

void loop() {
  if (wserial.available()) {
    Serial.println("reading serial, sending leds!");
    wserial.readLeds(leds, kNumLeds);
    espNowSender.send(leds, kNumLeds, nullptr);
  }
}
