#ifndef __INC_WARROLIGHT_H
#define __INC_WARROLIGHT_H

#include <FastLED.h>

// encoding constants
constexpr byte ENCODING_POS_RGB = 1;
constexpr byte ENCODING_POS_VGA = 2;
constexpr byte ENCODING_VGA = 3;
constexpr byte ENCODING_RGB = 4;
constexpr byte ENCODING_RGB565 = 5;

// VGA functions
byte vgaRed(byte vga);
byte vgaBlue(byte vga);
byte vgaGreen(byte vga);

// Light programs coded for Arduino
class Stars
{
public:
  void setup();
  void draw(CRGB *leds, unsigned int numLeds, unsigned long time);

private:
  bool m_init = false;

  int m_chance = 1000;
  int m_decay = 9900;
  int m_tone = 0;

  // TODO: assumes 150 leds as strip size
  byte m_stars[150];
  byte m_starsColors[150];
  byte m_starsSaturation[150];
};

class Rainbow
{
public:
  void setup();
  void draw(CRGB *leds, unsigned int numLeds, unsigned long time);

private:
  bool m_init = false;
  int m_speed = 5;
};

class Explosion
{
public:
  void setup();
  void draw(CRGB *leds, unsigned int numLeds, unsigned long time);

private:
  bool m_init = false;

  int m_tone;
  int m_saturation;

  int m_life = 30;
  int m_center = 5;
  int m_intensity = 30;
};

class Pulse
{
public:
  void setup();
  void draw(CRGB *leds, unsigned int numLeds, unsigned long time);

private:
  bool m_init = false;

  int m_tone;
  int m_speed;
};

class Sines
{
public:
  void setup();
  void draw(CRGB *leds, unsigned int numLeds, unsigned long time);

private:
  bool m_init = false;

  int m_saturation;
  int m_speed;
  int m_scale;
  int m_color_range;
  int m_color_tone;
  int m_contrast;
  int m_relative_time;
};


class MultiProgram
{
public:
  void setup();
  void setProgram(int program);
  void draw(CRGB *leds, unsigned int numLeds, unsigned long time);

private:
  bool m_init = false;
  int m_program = 0;

#define MULTIPROGRAM_INTERVAL 700
#define MULTIPROGRAM_NUM_PROGRAMS 5
  Stars m_stars;
  Rainbow m_rainbow;
  Explosion m_explosion;
  Pulse m_pulse;
  Sines m_sines;
};

// Warrolight serial communication protocol
class WSerial
{
public:
  bool available();
  void readLeds(CRGB *leds, int numLeds);

private:
  bool readPosRGB(CRGB *leds, int numLeds);
  bool readPosVGA(CRGB *leds, int numLeds);
  bool readVGA(CRGB *leds, int numLeds);
  bool readRGB(CRGB *leds, int numLeds);

  void drain();
  void reconnect();

  boolean connected = false;
  unsigned long lastConnectionTime = millis();
};

#endif
