#ifndef __INC_WARROLIGHT_H
#define __INC_WARROLIGHT_H

// encoding constants
const byte ENCODING_POS_RGB = 1;
const byte ENCODING_POS_VGA = 2;
const byte ENCODING_VGA = 3;
const byte ENCODING_RGB = 4;
const byte ENCODING_RGB565 = 5;

// VGA functions
byte vgaRed(byte vga);
byte vgaBlue(byte vga);
byte vgaGreen(byte vga);

#endif
