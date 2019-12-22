#include <Warrolight.h>

void Stars::setup()
{
  memset(m_stars, 0, sizeof(m_stars));
  memset(m_starsColors, 0, sizeof(m_starsColors));
  memset(m_starsSaturation, 0, sizeof(m_starsSaturation));
  int i = random(0, 1000);
  m_chance = 1000 - i;
  m_decay = 9999 - i;
  m_tone = random(0, 255);
  m_init = true;
}

void Stars::draw(CRGB *leds, unsigned int numLeds, unsigned long time)
{
  if (!m_init)
  {
    setup();
  }

  for (int i = 0; i < numLeds; i++)
  {
    if (random(0, m_chance) == 0)
    {
      m_stars[i] = min(255, (int)m_stars[i] + random(20, 255));
      m_starsColors[i] = random(0, 10) + (time / 10 % 255);
      m_starsSaturation[i] = random(0, 150) + 50;
    }
    if (m_stars[i] > 0)
    {
      m_stars[i] = max(0, (((long)m_stars[i]) * m_decay / 10000));
    }

    int h = ((int)m_starsColors[i] + m_tone) % 255;
    int s = m_starsSaturation[i];
    int v = m_stars[i];

    leds[i].setHSV(h, s, v);
  }

  if (time % (60 * 3 * 10) == 0)
  {
    m_init = false;
  }
}

void Rainbow::setup()
{
  //m_speed = random(1, 1);
  m_init = true;
}

void Rainbow::draw(CRGB *leds, unsigned int numLeds, unsigned long time)
{
  if (!m_init)
  {
    setup();
  }

  for (int i = 0; i < numLeds; i++)
  {
    int h = (i * 2 + time * 3 * m_speed) % 255;
    int s = 255;
    int v = sin8(i * 6 + time * m_speed);

    leds[i].setHSV(h, s, v);
  }
}
