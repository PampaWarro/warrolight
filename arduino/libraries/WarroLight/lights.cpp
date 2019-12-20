#ifndef _LIGHTS_H_INCLUDED
#define _LIGHTS_H_INCLUDED

#include "FastLED.h"
#include "WarroLight.h"

void writeLeds(int pos, uint8_t r, uint8_t g, uint8_t b) {
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

void writeLedsHSB(int pos, uint8_t h, uint8_t s, uint8_t b) {
  if (pos < 150) {
    leds[pos].setHSV(h, s, b);
  }
}

void writeLedsRgb565(int pos, uint8_t ba, uint8_t bb) {
    int rgb565 = ((int)(ba & 0xff) << 8) | ((int)(bb & 0xff)) ;
    uint8_t b = ((rgb565 & 0x001f)) << 3;
    uint8_t g = ((rgb565 & 0x7E0) >> 5) << 2;
    uint8_t r = ((rgb565) >> 11) << 3;
    writeLeds(pos, r, g, b);     
}


void writeLedFrame(char data[], int offset) {  
  int encoding = data[0+offset];
  if(encoding == ENCODING_RGB) {       
    for (int i = 0; i < NUM_LEDS; i++) {
      writeLeds(i, data[1+i * 3 + offset], data[1+1 + i * 3 + offset], data[1+2 + i * 3+offset]);
    }
  } else {
    Serial.println("Unexpected encoding byte");
  }
  FastLED.show();
}

#endif
