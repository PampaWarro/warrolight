#include <FastLED.h>

// How many leds in your strip?
// #define NUM_LEDS 150
#define NUM_LEDS 345

// For led chips like Neopixels, which have a data line, ground, and power, you just
// need to define DATA_PIN.  For led chipsets that are SPI based (four wires - data, clock,
// ground, and power), like the LPD8806 define both DATA_PIN and CLOCK_PIN
#define DATA_PIN 2
//#define DATA_PIN2 7
//#define DATA_PIN3 8
#define CLOCK_PIN 13

// Define the array of leds
CRGB leds[NUM_LEDS];
// CRGB leds2[NUM_LEDS];
// CRGB leds3[NUM_LEDS];

// This variable is persisted even after reseting the arduino. That allows cycling through
// different programs of light
__attribute__((section(".noinit"))) unsigned int program;

void setup() {
  program = (program + 1) % 2;
  //program = 0;

  // Uncomment/edit one of the following lines for your leds arrangement.
   FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
//    FastLED.addLeds<WS2812B, DATA_PIN2, GRB>(leds2, NUM_LEDS);
//    FastLED.addLeds<WS2812B, DATA_PIN3, GRB>(leds3, NUM_LEDS);

  FastLED.setMaxPowerInVoltsAndMilliamps(5, 300);

  Serial.begin(3*500000);           // set up Serial library at 500000 bps, the same than in Node.js

  Serial.println("Hello world!");  // prints hello with ending line break

  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i] = CRGB::Black;
  }

  leds[0] = CRGB::Black;
  leds[1] = CRGB::Red;
  leds[2] = CRGB::Green;
  leds[3] = CRGB::Blue;

//   leds2[1] = CRGB::Red;
//   leds2[2] = CRGB::Green;
//   leds2[3] = CRGB::Blue;

//   leds3[1] = CRGB::Red;
//   leds3[2] = CRGB::Green;
//   leds3[3] = CRGB::Blue;

  FastLED.show();
}

byte ENCODING_POS_RGB = 1;
byte ENCODING_POS_VGA = 2;
byte ENCODING_VGA = 3;
byte ENCODING_RGB = 4;

int j = 0;
byte pos = 3;
byte r = 0;
byte g = 0;
byte b = 0;

byte vgaRed(byte vga) {
  return ((vga & 0xE0) >> 5) * 32;
}
byte vgaBlue(byte vga) {
  return ((vga & 0x03)) * 64;
}
byte vgaGreen(byte vga) {
  return ((vga & 0x1C) >> 2) * 32;
}

void writeLeds(int pos, byte r, byte g, byte  b) {
//   if (pos < 150) {
    leds[pos].red = r;
    leds[pos].green = g;
    leds[pos].blue = b;
//   } else if(pos < 300) {
//     leds2[pos].red = r;
//     leds2[pos].green = g;
//     leds2[pos].blue = b;
//   } else {
//     leds3[pos].red = r;
//     leds3[pos].green = g;
//     leds3[pos].blue = b;
//   }
}

void writeLedsHSB(int pos, byte h, byte s, byte  b) {
  if (pos < 150) {
    leds[pos].setHSV(h, s, b);
  }
}


int stripSize = NUM_LEDS;


boolean connected = false;
void reconnect() {
  connected = false;
  drainSerial();
}

void drainSerial() {
  // Drain incoming bytes
  while (Serial.available() > 0) {
    Serial.read();
  }
}

boolean waitingSerial = true;
int waitingCounter = 0;
void loop() {
  if (connected || Serial.available() >= 2) {
    readLedsFromSerial();
  } else {
    //waitingCounter = 0;
    //arduinoProgram();
  }
}



unsigned long lastConnectionTime = millis();
void readLedsFromSerial() {
  if (!connected) {
    if (Serial.available() >= 3) {
      char a = Serial.read();
      char b = Serial.read();
      char c = Serial.read();
      if (a == 'X' && b == 'X' && c == 'X') {
        drainSerial();
        connected = true;
        Serial.println("YEAH");
        lastConnectionTime = millis();
      } else {
        drainSerial();
        delay(50);
      }
    }
    return;
  }

  if (Serial.available() < 2) {
    if ((millis() - lastConnectionTime) > 2000) {
      lastConnectionTime = millis();
      delay(500);
      reconnect();
    }
    return;
  }
  lastConnectionTime = millis();

  int encoding = Serial.read();
  if (encoding == ENCODING_POS_RGB) {
    int j = Serial.read();
    char data[4 * j];
    int total = Serial.readBytes(data, 4 * j);
    if (total == 4 * j) {
      for (int i = 0; i < stripSize; i++) {
        leds[i] = CRGB::Black;
      }
      for (int i = 0; i < j; i++) {
        pos = data[0 + i * 4];
        writeLeds(pos, data[1 + i * 4], data[2 + i * 4], data[3 + i * 4]);
      }
    } else {
      return reconnect();
    }
  } else if (encoding == ENCODING_POS_VGA) {
    int j = Serial.read();
    char data[2 * j];
    int total = Serial.readBytes(data, 2 * j);
    if (total == 2 * j) {
      for (int i = 0; i < stripSize; i++) {
        leds[i] = CRGB::Black;
      }
      for (int i = 0; i < j; i++) {
        pos = data[0 + i * 2];
        byte vga = data[1 + i * 2];
        writeLeds(pos, vgaRed(vga), vgaGreen(vga), vgaBlue(vga));
      }
    } else {
      return reconnect();
    }
  } else if (encoding == ENCODING_VGA) {
    int j = stripSize;
    char data[j];
    int readTotal = Serial.readBytes(data, j);
    if (readTotal == j) {
      for (int i = 0; i < j; i++) {
        byte vga = data[i];
        writeLeds(i, vgaRed(vga), vgaGreen(vga), vgaBlue(vga));
      }
    } else {
      return reconnect();
    }
  } else if (encoding == ENCODING_RGB) {
    int j = stripSize;
    char data[3 * j];
    int total = Serial.readBytes(data, 3 * j);
    if (total == 3 * j) {
      for (int i = 0; i < j; i++) {
        writeLeds(i, data[i * 3], data[1 + i * 3], data[2 + i * 3]);
      }
    } else {
      return reconnect();
    }
  } else {
    return reconnect();
  }

  FastLED.show();
  
  Serial.println("OK"); // ASCII printable characters
  
  // Protocolo que entiende node.js
}

boolean programInitialized = false;
