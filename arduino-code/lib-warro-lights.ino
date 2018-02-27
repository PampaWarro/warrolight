#include <bitswap.h>
#include <chipsets.h>
#include <color.h>
#include <colorpalettes.h>
#include <colorutils.h>
#include <controller.h>
#include <cpp_compat.h>
#include <dmx.h>
#include <FastLED.h>
#include <fastled_config.h>
#include <fastled_delay.h>
#include <fastled_progmem.h>
#include <fastpin.h>
#include <hsv2rgb.h>
#include <led_sysdefs.h>
#include <lib8tion.h>
#include <noise.h>
#include <pixelset.h>
#include <pixeltypes.h>
#include <platforms.h>
#include <power_mgt.h>

#include "FastLED.h"

int NUM_LEDS = 150;
int DATA_PIN = 6;
int DATA_PIN2 = 7;

// Define the array of leds
CRGB leds[NUM_LEDS];

void setupLeds(int numLeds, int dataPin1, int dataPin2) {
  NUM_LEDS = numLeds;
  DATA_PIN = dataPin1;
  DATA_PIN2 = dataPin2;
  
  // Uncomment/edit one of the following lines for your leds arrangement.
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 500);

  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i] = CRGB::Black;
  }

  leds[0] = CRGB::Black;
  leds[1] = CRGB::Red;
  leds[2] = CRGB::Green;
  leds[3] = CRGB::Blue;

  FastLED.show();
}

byte ENCODING_POS_RGB = 1;
byte ENCODING_POS_VGA = 2;
byte ENCODING_VGA = 3;
byte ENCODING_RGB = 4;

void writeLeds(int pos, byte r, byte g, byte  b) {
  if (pos < 150) {
    leds[pos].red = r;
    leds[pos].green = g;
    leds[pos].blue = b;
  }
}

void writeLedFrame(char[] data) {
  int encoding = data[0];
  if(encoding == ENCODING_RGB) {
    int j = NUM_LEDS;        
      for (int i = 0; i < j; i++) {
        writeLeds(i, data[i * 3], data[1 + i * 3], data[2 + i * 3]);
      }
  } else {
    Serial.println("Unexpected encoding byte");
  }

  FastLED.show();
}
