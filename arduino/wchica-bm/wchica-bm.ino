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

void writeLeds(int pos, byte r, byte g, byte b)
{
  if (pos < 150)
  {
    leds[pos].setRGB(r, g, b);
  }
}

int stripSize = NUM_LEDS;

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

boolean waitingSerial = true;
int waitingCounter = 0;
void loop()
{
  if (connected || Serial.available() >= 2)
  {
    readLedsFromSerial();
  }
  else
  {
    waitingCounter = 0;
    arduinoProgram();
  }
}

unsigned long lastConnectionTime = millis();
void readLedsFromSerial()
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
  if (encoding == ENCODING_POS_RGB)
  {
    int j = Serial.read();
    char data[4 * j];
    int total = Serial.readBytes(data, 4 * j);
    if (total == 4 * j)
    {
      for (int i = 0; i < stripSize; i++)
      {
        leds[i] = CRGB::Black;
      }
      for (int i = 0; i < j; i++)
      {
        int pos = data[0 + i * 4];
        writeLeds(pos, data[1 + i * 4], data[2 + i * 4], data[3 + i * 4]);
      }
    }
    else
    {
      return reconnect();
    }
  }
  else if (encoding == ENCODING_POS_VGA)
  {
    int j = Serial.read();
    char data[2 * j];
    int total = Serial.readBytes(data, 2 * j);
    if (total == 2 * j)
    {
      for (int i = 0; i < stripSize; i++)
      {
        leds[i] = CRGB::Black;
      }
      for (int i = 0; i < j; i++)
      {
        int pos = data[0 + i * 2];
        byte vga = data[1 + i * 2];
        writeLeds(pos, vgaRed(vga), vgaGreen(vga), vgaBlue(vga));
      }
    }
    else
    {
      return reconnect();
    }
  }
  else if (encoding == ENCODING_VGA)
  {
    int j = stripSize;
    char data[j];
    int readTotal = Serial.readBytes(data, j);
    if (readTotal == j)
    {
      for (int i = 0; i < j; i++)
      {
        byte vga = data[i];
        writeLeds(i, vgaRed(vga), vgaGreen(vga), vgaBlue(vga));
      }
    }
    else
    {
      return reconnect();
    }
  }
  else if (encoding == ENCODING_RGB)
  {
    int j = stripSize;
    char data[3 * j];
    int total = Serial.readBytes(data, 3 * j);
    if (total == 3 * j)
    {
      for (int i = 0; i < j; i++)
      {
        writeLeds(i, data[i * 3], data[1 + i * 3], data[2 + i * 3]);
      }
    }
    else
    {
      return reconnect();
    }
  }
  else
  {
    return reconnect();
  }

  FastLED.show();

  // Protocolo que entiende node.js
  Serial.println("OK"); // ASCII printable characters
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

  byte debugCycle = (time / 10) % 3;
  if (debugCycle == 0)
  {
    writeLeds(0, 10, 0, 20);
  }
  else
  {
    writeLeds(0, 0, 0, 0);
  }

  FastLED.show();
  time++;
}
