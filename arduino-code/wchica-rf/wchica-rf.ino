#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>


// How many leds in your strip?
#define NUM_LEDS 150

#define NUM_CHANNELS 1

RF24 radio(7, 8); // CE, CSN
const byte address[6] = "90909";

int PAYLOAD_SIZE = 32;

void setup() {
  Serial.begin(1152000/2);         // set up Serial library at 1152000 bps, the same than in Node.js

  radio.begin();
  radio.openWritingPipe(0xF0F0F0F0F0);
  //radio.setChannel(81);
  radio.setChannel(92);
  radio.setPALevel(RF24_PA_HIGH);
  radio.setPayloadSize(PAYLOAD_SIZE);
  radio.setDataRate(RF24_2MBPS);
  //radio.enableDynamicPayloads();
  radio.setAutoAck(false);
  radio.stopListening();
}

//byte ENCODING_POS_RGB = 1;
//byte ENCODING_POS_VGA = 2;
//byte ENCODING_VGA = 3;
byte ENCODING_RGB = 4;
byte ENCODING_RGB565 = 5;

int stripSize = NUM_LEDS*NUM_CHANNELS;

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
  if (connected || (Serial.available() >= 2)) {
    readLedsFromSerial();
  } else {
    waitingCounter = 0;
  }
}

char ledData[3 * NUM_LEDS * NUM_CHANNELS + 2];
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
  int pos = 0;
  /*if (encoding == ENCODING_POS_RGB) {
    int j = Serial.read();
    char data[4 * j];
    int total = Serial.readBytes(data, 4 * j);
    if (total == 4 * j) {
      for (int i = 0; i < stripSize; i++) {
        writeLeds(i, 0, 0, 0);
      }
      for (int i = 0; i < j; i++) {
        pos = data[0 + i * 4];
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
        writeLeds(i, 0, 0, 0);
      }
      for (int i = 0; i < j; i++) {
        pos = data[0 + i * 2];
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
    } else */
  if (encoding == ENCODING_RGB) {
    int j = stripSize;

    int total = Serial.readBytes(ledData+2, 3 * j);
    if (total != 3 * j) {
      return reconnect();
    }
  } else if (encoding == ENCODING_RGB565) {
    int j = stripSize;

    int total = Serial.readBytes(ledData+2, 2 * j);
    if (total != 2 * j) {
      return reconnect();
    }
  } else {
    Serial.println("WRONG ENCODING");
    return reconnect();
  }

  transmitRadio();

  Serial.println("OK"); // ASCII printable characters

  //delay(20);

  // Protocolo que entiende node.js
}

//int channels[] = {81, 114};
int channels[] = {92};

int bytesPerPixel = 3;
void transmitRadio() {
  for (int k = 0; k < NUM_CHANNELS; k++) {
    int channel = channels[k];
    radio.setChannel(channel);

    int offset = k * bytesPerPixel * NUM_LEDS;
    for (int j = 0; j < NUM_LEDS;) {
      /*char data[PAYLOAD_SIZE];
      data[0] = j;
      data[1] = 0;

      for (int i = 2; i+2 < PAYLOAD_SIZE && j < NUM_LEDS; i+=3) {
        data[i] = ledData[j*3+offset];
        data[i+1] = ledData[j*3+1+offset];
        data[i+2] = ledData[j*3+2+offset];
        j++;
      }

      radio.write(&data, sizeof(data));
      */

      ledData[offset] = j;
      ledData[offset + 1] = 0;
      radio.write(&ledData[offset], 32);
            
      offset = offset + 30;
      j += 30/bytesPerPixel;        
      
      
      //Serial.println("Escribi");

      /*while(!radio.write(&data, sizeof(data))){
        Serial.println("Write failed");
        }*/
    }
  }
}

