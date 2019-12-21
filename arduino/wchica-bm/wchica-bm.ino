#include <FastLED.h>
#include <Warrolight.h>

// How many leds in your strip?
// #define NUM_LEDS 150
#define NUM_LEDS 150

// For led chips like Neopixels, which have a data line, ground, and power, you
// just need to define DATA_PIN.  For led chipsets that are SPI based (four
// wires - data, clock, ground, and power), like the LPD8806 define both
// DATA_PIN and CLOCK_PIN
#define DATA_PIN 6
#define DATA_PIN2 7

// Define the array of leds
CRGB leds[NUM_LEDS];

// This variable is persisted even after reseting the arduino. That allows
// cycling through different programs of light
__attribute__((section(".noinit"))) unsigned int program;

void setup() {
  program = (program + 1) % 2;
  // program = 0;

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

void writeLeds(int pos, byte r, byte g, byte b) {
  if (pos < 150) {
    leds[pos].red = r;
    leds[pos].green = g;
    leds[pos].blue = b;
  }
}

void writeLedsHSB(int pos, byte h, byte s, byte b) {
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
    waitingCounter = 0;
    arduinoProgram();
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
    //} else if (program == 1){

  } else {
    programStars();
  }

  // programSusi();

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
// STARS
// ////////////////////////////////////////////////////////////////////////////
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
    PARAM_TONE = rng(0, 255);
    programInitialized = true;
  }

  for (int i = 0; i < NUM_LEDS; i++) {
    if (rng(0, PARAM_CHANCE) == 0) {
      stars[i] = min(255, (int)stars[i] + rng(20, 255));
      starsColors[i] = rng(0, 10) + (time / 10 % 255);
      starsSaturation[i] = rng(0, 150) + 50;
    }
    if (stars[i] > 0) {
      stars[i] = max(0, (((long)stars[i]) * PARAM_DECAY / 10000));
    }

    // byte pos = i+(time/5)%NUM_LEDS;
    byte pos = i;
    writeLedsHSB(pos, ((int)starsColors[i] + PARAM_TONE) % 255,
                 starsSaturation[i], stars[i]);
  }

  if (time % (60 * 3 * 10) == 0) {
    programInitialized = false;
  }
}

// create a random integer from 0 - 65535
unsigned int rng(int from, int to) {
  static unsigned int y = 0;
  y += micros(); // seeded with changing number
  y ^= y << 2;
  y ^= y >> 7;
  y ^= y << 7;
  return y % (to - from) + from;
}

/////////////////////////////////////////////////////////////////////////////////////
// RAINBOW
// //////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

byte sines[] = {
    0,   12,  25,  38,  50,  63,  75,  87,  99,  110, 122, 133, 143, 154, 164,
    173, 182, 191, 199, 207, 214, 221, 227, 232, 237, 241, 245, 248, 251, 253,
    254, 254, 254, 254, 252, 250, 248, 245, 241, 236, 231, 226, 220, 213, 206,
    198, 190, 181, 172, 162, 152, 142, 131, 120, 108, 97,  85,  73,  61,  48,
    35,  23,  10,  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
    0,   0,   0,   0,   0,   0,   4,   17,  29,  42,  54,  67,  79,  91,  103,
    114, 125, 136, 147, 157, 167, 176, 185, 194, 202, 209, 216, 223, 229, 234};
int PARAM_SPEED = 5;
void programRainbow() {
  if (!programInitialized) {
    // PARAM_SPEED = random(1, 1);
    programInitialized = true;
  }

  for (int i = 0; i < NUM_LEDS; i++) {
    int pixelOff = ((i + time) % 50) > 0 ? 0 : 1;
    writeLedsHSB(i, (i * 2 + time * 3 * PARAM_SPEED) % 255, 255,
                 sines[(i * 6 + time * PARAM_SPEED) % 150]);
  }
}

/////////////////////////////////////////////////////////////////////////////////////
// SUSI
// /////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
void programSusi() {
  for (int i = 0; i < NUM_LEDS; i++) {
    if (i == ((time / 20) % NUM_LEDS)) {
      writeLedsHSB(i, 130 + ((time / 10) % 100), 255, 255);
    } else {
      writeLeds(i, 0, 0, 0);
    }
  }
}
