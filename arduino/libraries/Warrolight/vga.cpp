#include <stdint.h>

uint8_t vgaRed(uint8_t vga) {
  return ((vga & 0xE0) >> 5) * 32;
}

uint8_t vgaBlue(uint8_t vga) {
  return ((vga & 0x03)) * 64;
}

uint8_t vgaGreen(uint8_t vga) {
  return ((vga & 0x1C) >> 2) * 32;
}
