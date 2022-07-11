#include <OctoWS2811.h>
// OctoWS2811 must be imported first, before FastLED.
#define USE_OCTOWS2811
#include <FastLED.h>
#include <QNEthernet.h>
#include <TeensyID.h>
#include <WarroUDP.h>

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

using qindesign::network::Ethernet;
using qindesign::network::EthernetUDP;
using qindesign::network::MDNS;
using warrolight::WarroUDP;

CRGB leds[kNumLeds];

EthernetUDP udp;
WarroUDP warroUDP(Serial, udp, kUdpPort, kNumLeds);

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
      warroUDP.broadcastAlive();
    }
  });
  Ethernet.onAddressChanged([]() {
    Serial.print("Ethernet address changed: ");
    Ethernet.localIP().printTo(Serial);
    Serial.println("");
    warroUDP.broadcastAlive();
  });
#ifndef HOSTNAME
  String hostname = String("teensy-") + String(teensySN());
#else
#define QUOTE(x) #x
  String hostname = QUOTE(HOSTNAME);
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

void loop() {
  const bool newFrame = warroUDP.readFrame(leds);
  if (!newFrame && !warroUDP.connected()) {

    fadeToBlackBy(leds, kNumLeds, 5);
    uint8_t dothue = 0;
    for (int i = 0; i < 8; i++) {
      leds[(5 * (10 + i) * millis() / 1000) % kNumLeds] |=
          CHSV(dothue, 200, 255);
      dothue += 32;
    }

    if (millis() < 10000) {
      // Set the first n leds on each strip to show which strip it is
      for (size_t i = 0; i < kNumStrips; i++) {
        for (size_t j = 0; j <= i; j++) {
          leds[(i * kNumLedsPerStrip) + j] = CRGB::Red;
        }
      }
    }
  }

  FastLED.show();

  maybePrintStats();
}
