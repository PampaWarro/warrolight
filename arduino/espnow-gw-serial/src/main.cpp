#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESPNOWPixels.h>
#include <Warrolight.h>
#include <espnow.h>

// Valid range [0, 20.5].
// https://arduino-esp8266.readthedocs.io/en/latest/esp8266wifi/generic-class.html#setoutputpower
static constexpr float kPower = 20.5;
static constexpr int kChannel = 7;
static constexpr uint8_t kBroadcastAddress[]{0xff, 0xff, 0xff,
                                             0xff, 0xff, 0xff};

#if defined(ARDUINO_ARCH_ESP8266)
#define ESP_ERROR_CHECK_WITHOUT_ABORT(x)
#define ESP_OK 0
#endif

#define TRUE_OR_RESTART(x)           \
  do {                               \
    if (!x) {                        \
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

WSerial wserial;
static constexpr size_t kNumLeds = 300;
CRGB leds[kNumLeds];
ESPNOWSender espNowSender(kNumLeds, 1);

void setup() {
  Serial.begin(460800);
  Serial.println();
  Serial.println("Warrolight ESP-NOW Gateway");

  Serial.println("Initializing ESP-NOW...");
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setOutputPower(kPower);
  WiFi.begin(WiFi.softAPmacAddress(), "", kChannel, /*bssid=*/nullptr,
             /*connect=*/false);
  WiFi.disconnect(/*wifioff=*/false);

  ESP_OK_OR_RESTART(esp_now_init());
  ESP_OK_OR_RESTART(esp_now_set_self_role(ESP_NOW_ROLE_CONTROLLER));
  ESP_OK_OR_RESTART(esp_now_add_peer(const_cast<u8*>(kBroadcastAddress),
                                     ESP_NOW_ROLE_SLAVE,
                                     static_cast<u8>(kChannel), nullptr, 0));

  for (size_t i = 0; i < kNumLeds; i++) {
    leds[i] = CRGB::Black;
  }
  Serial.println("Ready!");
}

void loop() {
  if (wserial.available()) {
    wserial.readLeds(leds, kNumLeds);
    TRUE_OR_RESTART(espNowSender.send(leds));
  }
}
