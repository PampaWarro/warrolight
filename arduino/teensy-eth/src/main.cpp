#include <OctoWS2811.h>
// OctoWS2811 must be imported first, before FastLED.
#define USE_OCTOWS2811
#include <FastLED.h>
// Other imports below.
#include <QNEthernet.h>
#include <TeensyID.h>
#include <WarroUDP.h>

#include <cmath>
#include <limits>

#ifndef LEDS_PER_STRIP
#define LEDS_PER_STRIP 300
#endif // LEDS_PER_STRIP

#ifndef UDP_PORT
#define UDP_PORT 8888
#endif // UDP_PORT

static constexpr size_t kNumLedsPerStrip = LEDS_PER_STRIP;
static constexpr size_t kNumStrips = 8;  // Always 8 with OctoWS2811.
static constexpr size_t kNumLeds = kNumLedsPerStrip * kNumStrips;
static constexpr uint16_t kUdpPort = UDP_PORT;
static const IPAddress kBroadcastIP{255, 255, 255, 255};
static constexpr unsigned long kFadeInMillis = 30000;

using qindesign::network::Ethernet;
using qindesign::network::EthernetUDP;
using qindesign::network::MDNS;

CRGB leds[kNumLeds];

void handleFrame(CRGB* pixels, size_t length) {
  if (length != kNumLeds) {
    EVERY_N_SECONDS(1) {
      Serial.print("Got frame with length ");
      Serial.print(length);
      Serial.print(" which doesn't match the expected ");
      Serial.print(kNumLeds);
      Serial.println(".");
    }
  }
  std::copy(pixels, pixels + std::min(kNumLeds, length), leds);
}

EthernetUDP udp;
WarroUDP warroUDP(kNumLeds, handleFrame);

bool broadcastUdp(const uint8_t* data, size_t length) {
  udp.beginPacket(kBroadcastIP, kUdpPort);
  udp.write(data, length);
  udp.endPacket();
  return true;
}

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 4000) {
    // Wait for serial initialization.
  }
  qindesign::network::stdPrint = &Serial;

  FastLED.addLeds<OCTOWS2811>(leds, kNumLedsPerStrip);

  Ethernet.onLinkState([](bool state) {
    Serial.printf("Ethernet link state: %s.\n", state ? "on" : "off");
    if (state) {
      warroUDP.broadcastAlive(broadcastUdp);
    }
  });
  Ethernet.onAddressChanged([]() {
    Serial.print("Ethernet address changed: ");
    Ethernet.localIP().printTo(Serial);
    Serial.println("");
    warroUDP.broadcastAlive(broadcastUdp);
  });
#ifndef HOSTNAME
  String hostname = String("teensy-") + String(teensySN());
#else
#define QUOTE(x) _QUOTE(x)
#define _QUOTE(x) #x
  String hostname = QUOTE(HOSTNAME);
#undef _QUOTE
#undef QUOTE
#endif // HOSTNAME
  Serial.println(hostname);
  Ethernet.setHostname(hostname);
  Ethernet.begin();
  MDNS.begin(hostname);
  udp.begin(kUdpPort);
}

void maybePrintStats() {
  static unsigned long last_status_millis = millis();
  unsigned long current_millis = millis();
  static uint32_t loop_count = 0;
  if (current_millis - last_status_millis >= 1000) {
    Serial.printf("fps:%d", loop_count);
    Serial.println();
    //
    loop_count = 0;
    last_status_millis = current_millis;
  }
  ++loop_count;
}

std::vector<uint8_t> udp_buffer;
unsigned long last_packet_millis = millis();

void loop() {
  const int packet_size = udp.parsePacket();
  if (packet_size > 0) {
    last_packet_millis = millis();
    if (static_cast<size_t>(packet_size) > udp_buffer.size()) {
      udp_buffer.resize(packet_size);
    }
    udp.readBytes(udp_buffer.data(), packet_size);
    warroUDP.handlePacket(udp_buffer.data(), packet_size);
  } else if (millis() - last_packet_millis > 1000) {
    fadeToBlackBy(leds, kNumLeds, 5);
    uint8_t dothue = 0;
    for (int i = 0; i < 16; i++) {
      leds[(5 * (10 + i) * (30000 + millis()) / 1000) % kNumLeds] |=
          CHSV(dothue, 200, 255);
      dothue += 16;
    }
  }

  const unsigned long currentMillis = millis();
  if (currentMillis < kFadeInMillis) {
    float fadeInRatio = static_cast<float>(currentMillis) / kFadeInMillis;
    FastLED.setBrightness(static_cast<uint8_t>(255.f * fadeInRatio * fadeInRatio));
    // Set the first n leds on each strip to show which strip it is
    for (size_t i = 0; i < kNumStrips; i++) {
      for (size_t j = 0; j <= i; j++) {
        leds[(i * kNumLedsPerStrip) + j] = CRGB::Red;
      }
    }
  } else {
    FastLED.setBrightness(std::numeric_limits<uint8_t>::max());
  }

  FastLED.show();

  maybePrintStats();
}
