Arduino protocol
================

The is an attempt to document the current protocol to communicate between the lights server and the Arduinos so that we can make informed decisions when introducing changes or debugging it.

## Serial protocol

After opening the serial port, the server waits 2s to send an "initial kick" (several empirical tests have shown us that 1 or 2 seconds are needed until data can be transmitted successfully). The initial kick message consists of the 3-byte ASCII string `XXX`.

If the Arduino is not connected:

 - If the Arduino has 3 or more bytes to read from the serial port, it reads the first 3 bytes and checks if they match the string `XXX`. If they do, then it drains the serial port, sets its state to connected and responds with the 4-byte ack message `YEAH`. If this first message does not match `XXX`, then it consumes the rest of the serial port and waits 50 milliseconds to read again.

If the Arduino is connected:

 - If the Arduino has less than 2 bytes to read from the serial port, ignore it. Otherwise interpret it as a lights packet. Light packets start with 1 byte defining the encoding followed by a variable number of bytes with the light's data that depends on the encoding and the number of leds. The encoding byte can be any of `POS_RGB` (1), `POS_VGA` (2), `VGA` (3), `RGB` (4), or `RGB565`. The board reads the first byte, then reads the expected number of bytes according to the encoding, updates the lights and finally sends the 2-byte ASCII message `OK` to acknowledge the new lights state.

## Encodings

### POS_RGB

Includes a 1 byte header with the number of lights that this packet will set. Uses 4 bytes for each light. The first byte indicates the position of light, then the following 3 bytes define the colors in RGB order. Light positions that don't have a color in the packet are set to black.

### POS_VGA

Includes a 1 byte header with the number of lights that this packet will set. Uses 2 bytes for each light. The first byte indicates the position of the light, then the following byte encodes a color using 3 bits for red, 3 bits for green and 2 bits for blue. Light positions that don't have a color in the packet are set to black.

### VGA

Uses 1 byte for each light, with colors specified as in `POS_VGA`. Every light configured in this board must have a value.

### RGB

Uses 3 bytes for each light, in RGB order. Every light configured in this board must have a value.

### RGB565

Uses 2 bytes for each light. The colors are encoded using 5 bits for red, 6 bits for green, and 5 bits for blue, making a total of 16 bits (= 2 bytes).

## Ethernet protocol

TODO

## RF protocol

TODO, specify channels, RF parameters, etc.
