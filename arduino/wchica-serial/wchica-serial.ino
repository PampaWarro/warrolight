#include <FastLED.h>
#include <Warrolight.h>

// How many leds in your strip?
#define NUM_LEDS 150

// For led chips like Neopixels, which have a data line, ground, and power, you
// just need to define DATA_PIN.  For led chipsets that are SPI based (four
// wires - data, clock, ground, and power), like the LPD8806 define both
// DATA_PIN and CLOCK_PIN
#define DATA_PIN 6

// Define the array of leds
CRGB leds[NUM_LEDS];

// This variable is persisted even after reseting the arduino. That allows
// cycling through different programs of light
__attribute__((section(".noinit"))) unsigned int program;

void setup()
{
  randomSeed(analogRead(0));

  program = (program + 1) % 2;
  // program = 0;

  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 300);

  Serial.begin(576000);

  for (int i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = CRGB::Black;
  }

  leds[0] = CRGB::Black;
  leds[1] = CRGB::Red;
  leds[2] = CRGB::Green;
  leds[3] = CRGB::Blue;

  FastLED.show();
}

boolean connected = false;
void reconnect()
{
  connected = false;
  drainSerial();
}

void drainSerial()
{
  // Drain incoming bytes
  while (Serial.available() > 0)
  {
    Serial.read();
  }
}

void loop()
{
  if (connected || Serial.available() >= 2)
  {
    readLedsFromSerial(leds, NUM_LEDS);
  }
  else
  {
    arduinoProgram();
  }
}

unsigned long lastConnectionTime = millis();
void readLedsFromSerial(CRGB *leds, int numLeds)
{
  if (!connected)
  {
    if (Serial.available() >= 3)
    {
      char a = Serial.read();
      char b = Serial.read();
      char c = Serial.read();
      if (a == 'X' && b == 'X' && c == 'X')
      {
        drainSerial();
        connected = true;
        Serial.println("YEAH");
        lastConnectionTime = millis();
      }
      else
      {
        drainSerial();
        delay(50);
      }
    }
    return;
  }

  if (Serial.available() < 2)
  {
    if ((millis() - lastConnectionTime) > 2000)
    {
      lastConnectionTime = millis();
      delay(500);
      reconnect();
    }
    return;
  }
  lastConnectionTime = millis();

  int encoding = Serial.read();
  int ok = false;

  if (encoding == ENCODING_POS_RGB)
    ok = readPosRGB(leds, numLeds);
  else if (encoding == ENCODING_POS_VGA)
    ok = readPosVGA(leds, numLeds);
  else if (encoding == ENCODING_VGA)
    ok = readVGA(leds, numLeds);
  else if (encoding == ENCODING_RGB)
    ok = readRGB(leds, numLeds);

  if (!ok)
  {
    reconnect();
    return;
  }

  FastLED.show();

  Serial.println("OK");
}

bool readPosRGB(CRGB *leds, int numLeds)
{
  int j = Serial.read();
  char data[4 * j];
  int total = Serial.readBytes(data, 4 * j);
  if (total != 4 * j)
    return false;

  for (int i = 0; i < numLeds; i++)
    leds[i] = CRGB::Black;

  for (int i = 0; i < j; i++)
  {
    int pos = data[0 + i * 4];
    int r = data[1 + i * 4];
    int g = data[2 + i * 4];
    int b = data[3 + i * 4];
    leds[pos].setRGB(r, g, b);
  }
  return true;
}

bool readPosVGA(CRGB *leds, int numLeds)
{
  int j = Serial.read();
  char data[2 * j];
  int total = Serial.readBytes(data, 2 * j);
  if (total != 2 * j)
    return false;

  for (int i = 0; i < numLeds; i++)
    leds[i] = CRGB::Black;

  for (int i = 0; i < j; i++)
  {
    int pos = data[0 + i * 2];
    byte vga = data[1 + i * 2];
    leds[pos].setRGB(vgaRed(vga), vgaGreen(vga), vgaBlue(vga));
  }
  return true;
}

bool readVGA(CRGB *leds, int numLeds)
{
  char data[numLeds];
  int readTotal = Serial.readBytes(data, numLeds);
  if (readTotal != numLeds)
    return false;

  for (int i = 0; i < numLeds; i++)
  {
    byte vga = data[i];
    leds[i].setRGB(vgaRed(vga), vgaGreen(vga), vgaBlue(vga));
  }
  return true;
}

bool readRGB(CRGB *leds, int numLeds)
{
  char data[3 * numLeds];
  int total = Serial.readBytes(data, 3 * numLeds);
  if (total != 3 * numLeds)
    return false;

  for (int i = 0; i < numLeds; i++)
  {
    int r = data[i * 3];
    int g = data[1 + i * 3];
    int b = data[2 + i * 3];
    leds[i].setRGB(r, g, b);
  }

  return true;
}

Stars starsProgram;
Rainbow rainbowProgram;

unsigned long time = 0;
void arduinoProgram()
{
  if (program == 0)
  {
    rainbowProgram.draw(leds, NUM_LEDS, time);
  }
  else
  {
    starsProgram.draw(leds, NUM_LEDS, time);
  }

  // TODO: remove or add a comment about this
  byte debugCycle = (time / 10) % 3;
  if (debugCycle == 0)
  {
    leds[0].setRGB(10, 0, 20);
  }
  else
  {
    leds[0].setRGB(0, 0, 0);
  }

  FastLED.show();
  time++;
}
