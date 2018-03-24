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

#define STRIP_NUM_LEDS 150

int NUM_LEDS = STRIP_NUM_LEDS;

#define DATA_PIN 6
#define DATA_PIN2 7

// Define the array of leds
CRGB leds[STRIP_NUM_LEDS];
CRGB leds2[STRIP_NUM_LEDS];

void setupLeds(int numLeds, int dataPin1, int dataPin2) {
  NUM_LEDS = numLeds;

  // Uncomment/edit one of the following lines for your leds arrangement.
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, STRIP_NUM_LEDS);    
  FastLED.addLeds<WS2812B, DATA_PIN2, GRB>(leds2, STRIP_NUM_LEDS);    
  
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 5000);

  for (int i = 0; i < NUM_LEDS; i++) {   
    writeLeds(i,0,0,0);
  }

  for(int i=0;i<2;i++){
    writeLeds(0+i*STRIP_NUM_LEDS, 0, 0, 0); // Black
    writeLeds(1+i*STRIP_NUM_LEDS, 255, 0, 0); // Red
    writeLeds(2+i*STRIP_NUM_LEDS, 0, 255, 0); // Green
    writeLeds(3+i*STRIP_NUM_LEDS, 0, 0, 255); // Blue   
  }

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
  } else {
    leds2[pos-150].red = r;
    leds2[pos-150].green = g;
    leds2[pos-150].blue = b;    
  }
}

void writeLedFrame(char data[], int offset) {  
  int encoding = data[0+offset];
  if(encoding == ENCODING_RGB) {       
    for (int i = 0; i < NUM_LEDS; i++) {
      writeLeds(i, data[1+i * 3 + offset], data[1+1 + i * 3 + offset], data[1+2 + i * 3+offset]);
      //writeLeds(i, i, 0, 0);
    }
  } else {
    Serial.println("Unexpected encoding byte");
  }
  FastLED.show();
}
