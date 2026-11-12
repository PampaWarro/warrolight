#ifndef JOYA_BADGE_EFFECTS_H
#define JOYA_BADGE_EFFECTS_H

#define USE_GET_MILLISECOND_TIMER
#include <FastLED.h>

#define NUM_LEDS 13
static constexpr uint8_t kNumEffects = 12;

extern CRGB leds[NUM_LEDS];
extern CRGBPalette16 currentPalette;

// Names in firmware order (same order as the artifact and the remote).
extern const char* const kEffectNames[kNumEffects];

// Called once from setup(): builds the neighbour table.
void effectsInit();

// Draw one 17 ms frame of effect `index` into leds[].
// `badge` picks the 2D version (LED positions from the KiCad file);
// false picks the strip version the firmware ran before (chain order).
void drawEffect(uint8_t index, bool badge);

#endif  // JOYA_BADGE_EFFECTS_H
