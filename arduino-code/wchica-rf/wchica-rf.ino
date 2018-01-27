#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>


// How many leds in your strip?
#define NUM_LEDS 150

RF24 radio(7, 8); // CE, CSN
const byte address[6] = "90909";

int PAYLOAD_SIZE = 32;

byte ledsR[NUM_LEDS];
byte ledsG[NUM_LEDS];
byte ledsB[NUM_LEDS];

void setup() {
  Serial.begin(576000);           // set up Serial library at 1152000 bps, the same than in Node.js

  for (int i = 0; i < NUM_LEDS; i++) {
    writeLeds(i, 0, 0, 0);
  }

  radio.begin();
  radio.openWritingPipe(0xF0F0F0F0F0);
  radio.setChannel(124);
  radio.setPALevel(RF24_PA_HIGH);
  radio.setPayloadSize(PAYLOAD_SIZE);
  radio.setDataRate(RF24_2MBPS);
  //radio.enableDynamicPayloads();  
  radio.setAutoAck(true);
  radio.stopListening();
}

byte ENCODING_POS_RGB = 1;
byte ENCODING_POS_VGA = 2;
byte ENCODING_VGA = 3;
byte ENCODING_RGB = 4;

int j = 0;
byte pos = 3;
byte r = 0;
byte g = 0;
byte b = 0;

byte vgaRed(byte vga) {
  return ((vga & 0xE0) >> 5) * 32;
}
byte vgaBlue(byte vga) {
  return ((vga & 0x03)) * 64;
}
byte vgaGreen(byte vga) {
  return ((vga & 0x1C) >> 2) * 32;
}

void writeLeds(int pos, byte r, byte g, byte  b) {
  if (pos < 150) {
    ledsR[pos] = r;
    ledsG[pos] = g;
    ledsB[pos] = b;
  }
}

int stripSize = NUM_LEDS;

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
  if (connected || Serial.available() >= 2) {
    readLedsFromSerial();
  } else {
    waitingCounter = 0;
    arduinoProgram();
  }
}



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
  if (encoding == ENCODING_POS_RGB) {
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
  } else if (encoding == ENCODING_RGB) {
    int j = stripSize;
    char data[3 * j];
    int total = Serial.readBytes(data, 3 * j);
    if (total == 3 * j) {
      for (int i = 0; i < j; i++) {
        writeLeds(i, data[i * 3], data[1 + i * 3], data[2 + i * 3]);
      }
    } else {
      return reconnect();
    }
  } else {
    return reconnect();
  }
  
  transmitRadio();

  Serial.println("OK"); // ASCII printable characters
  //delay(20);

  // Protocolo que entiende node.js
}


unsigned long time = 0;
void arduinoProgram() {
  byte debugCycle = (time / 10) % 3;
  if (debugCycle == 0) {
    writeLeds(0, 10, 0, 20);
  } else {
    writeLeds(0, 0, 0, 0);
  }

  time++;
}

void transmitRadio() {
  for (int j = 0; j < NUM_LEDS;) {
    char data[PAYLOAD_SIZE];
    data[0] = j;
    data[1] = 0;
    for (int i = 2; i+2 < PAYLOAD_SIZE && j < NUM_LEDS; i+=3) {
      data[i] = ledsR[j];
      data[i+1] = ledsG[j];
      data[i+2] = ledsB[j];
      j++;
    }
     //radio.write(&data, sizeof(data));
    //Serial.println("Escribi");
    while(!radio.write(&data, sizeof(data))){
      //Serial.println("Write failed");
    }
  }
}

