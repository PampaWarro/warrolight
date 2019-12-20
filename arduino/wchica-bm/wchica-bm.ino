#include "FastLED.h"
#include <Warrolight.h>

void setup() {
  program = (program + 1) % 2;

  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 300);

  Serial.begin(576000);

  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i] = CRGB::Black;
  }

  leds[0] = CRGB::Black;
  leds[1] = CRGB::Red;
  leds[2] = CRGB::Green;
  leds[3] = CRGB::Blue;

  FastLED.show();
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
unsigned long lastConnectionTime = millis();

void loop() {
  if (connected || Serial.available() >= 2) {
    readLedsFromSerial();
  } else {
    waitingCounter = 0;
    arduinoProgram();
  }
}

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
        int pos = data[0 + i * 4];
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
        int pos = data[0 + i * 2];
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

  // Protocolo que entiende node.js
  Serial.println("OK"); // ASCII printable characters
}


unsigned long time = 0;
void arduinoProgram() {
  if (program == 0) {
    programRainbow();
  } else {
    programStars();
  }

  byte debugCycle = (time / 10) % 3;
  if (debugCycle == 0) {
    writeLeds(0, 10, 0, 20);
  } else {
    writeLeds(0, 0, 0, 0);
  }

  FastLED.show();
  time++;
}

boolean programInitialized = false;

/////////////////////////////////////////////////////////////////////////////////////
// STARS ////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
byte stars[NUM_LEDS];
byte starsColors[NUM_LEDS];
byte starsSaturation[NUM_LEDS];

int PARAM_CHANCE = 1000;
int PARAM_DECAY = 9900;
int PARAM_TONE = 0;

void programStars() {
  if (!programInitialized) {
    memset(stars, 0, sizeof(stars));
    memset(stars, 0, sizeof(starsColors));
    memset(stars, 0, sizeof(starsSaturation));
    int i = rng(0, 1000);
    PARAM_CHANCE = 1000 - i;
    PARAM_DECAY = 9999 - i;
    PARAM_TONE = rng(0,255);
    programInitialized = true;
  }

  for (int i = 0; i < NUM_LEDS; i++) {
    if (rng(0, PARAM_CHANCE) == 0) {
      stars[i] = min(255, (int)stars[i] + rng(20, 255));
      starsColors[i] = rng(0, 10)+(time/10 % 255);
      starsSaturation[i] = rng(0, 150)+50;
    }
    if (stars[i] > 0) {
      stars[i] = max(0, (((long)stars[i]) * PARAM_DECAY / 10000));
    }

    //byte pos = i+(time/5)%NUM_LEDS;
    byte pos = i;
    writeLedsHSB(pos, ((int)starsColors[i]+PARAM_TONE)%255, starsSaturation[i], stars[i]);
  }

  if(time % (60*3*10) == 0) {
    programInitialized = false;
  }
}

// create a random integer from 0 - 65535
unsigned int rng(int from, int to) {
  static unsigned int y = 0;
  y += micros(); // seeded with changing number
  y ^= y << 2; y ^= y >> 7; y ^= y << 7;
  return y % (to - from) + from;
}
