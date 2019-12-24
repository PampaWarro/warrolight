#include <HardwareSerial.h>
#include <Warrolight.h>

WSerial::WSerial() { m_lastConnectionTime = millis(); }

bool WSerial::read(CRGB *leds, int numLeds)
{
  if (!m_connected)
  {
    if (Serial.available() >= 3)
    {
      char a = Serial.read();
      char b = Serial.read();
      char c = Serial.read();
      if (a == 'X' && b == 'X' && c == 'X')
      {
        drain();
        m_connected = true;
        Serial.println("YEAH");
        m_lastConnectionTime = millis();
      }
      else
      {
        drain();
        delay(50);
      }
    }
    return false;
  }

  if (Serial.available() < 2)
  {
    if ((millis() - m_lastConnectionTime) > 2000)
    {
      m_lastConnectionTime = millis();
      delay(500);
      reconnect();
    }
    return false;
  }

  m_lastConnectionTime = millis();

  int encoding = Serial.read();

  bool ok = false;

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
    return false;
  }

  Serial.println("OK");

  return true;
}

bool WSerial::readPosVGA(CRGB *leds, int numLeds)
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

bool WSerial::readPosRGB(CRGB *leds, int numLeds)
{
  int j = Serial.read();
  char data[2 * j];
  int total = Serial.readBytes(data, 2 * j);

  if (total != 2 * j)
    return false;

  for (int i = 0; i < numLeds; i++)
  {
    leds[i] = CRGB::Black;
  }

  for (int i = 0; i < j; i++)
  {
    int pos = data[0 + i * 2];
    byte vga = data[1 + i * 2];
    leds[pos].setRGB(vgaRed(vga), vgaGreen(vga), vgaBlue(vga));
  }

  return true;
}

bool WSerial::readVGA(CRGB *leds, int numLeds)
{
  int j = numLeds;
  char data[j];
  int readTotal = Serial.readBytes(data, j);

  if (readTotal != j)
    return false;

  for (int i = 0; i < j; i++)
  {
    byte vga = data[i];
    leds[i].setRGB(vgaRed(vga), vgaGreen(vga), vgaBlue(vga));
  }

  return true;
}

bool WSerial::readRGB(CRGB *leds, int numLeds)
{
  int j = numLeds;
  char data[3 * j];
  int total = Serial.readBytes(data, 3 * j);

  if (total == 3 * j)
    return false;

  for (int i = 0; i < j; i++)
  {
    int r = data[i * 3];
    int g = data[1 + i * 3];
    int b = data[2 + i * 3];
    leds[i].setRGB(r, g, b);
  }

  return true;
}

void WSerial::reconnect()
{
  m_connected = false;
  drain();
}

void WSerial::drain()
{
  while (Serial.available() > 0)
    Serial.read();
}
