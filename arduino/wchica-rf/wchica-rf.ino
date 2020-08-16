#include <RF24.h>
#include <SPI.h>
#include <Warrolight.h>
#include <nRF24L01.h>

// How many leds in your strip?
#define NUM_LEDS 150

#define NUM_CHANNELS 2

#define RADIO_PAYLOAD_SIZE 32

RF24 radio(7, 8); // CE, CSN

void setup() {
  Serial.begin(500000);
  Serial.println("ARDUINOSTART");
  radio.begin();
  radio.openWritingPipe(0xF0F0F0F0F0);
  // radio.setChannel(81);
  radio.setChannel(92);
  radio.setPALevel(RF24_PA_HIGH);
  radio.setPayloadSize(RADIO_PAYLOAD_SIZE);
  radio.setDataRate(RF24_2MBPS);
  // radio.enableDynamicPayloads();
  radio.setAutoAck(false);
  radio.stopListening();
}

int stripSize = NUM_LEDS * NUM_CHANNELS;

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

int waitingCounter = 0;

void loop() {
  if (connected || (Serial.available() >= 2)) {
    readLedsFromSerial();
    waitingCounter = 0;
  } else {
    waitingCounter++;
    if (waitingCounter == 200000) {
      Serial.println("WAITING");
      waitingCounter = 0;
    }
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
      Serial.println("INVALID");
      delay(500);
      reconnect();
    }
    return;
  }
  lastConnectionTime = millis();

  int encoding = Serial.read();
  int pos = 0;

  if (encoding == ENCODING_RGB) {
    int j = stripSize;

    int total = Serial.readBytes(ledData + 2, 3 * j);
    if (total != 3 * j) {
      return reconnect();
    }
  } else if (encoding == ENCODING_RGB565) {
    int j = stripSize;

    int total = Serial.readBytes(ledData + 2, 2 * j);
    if (total != 2 * j) {
      return reconnect();
    }
  } else {
    Serial.println("WRONG ENCODING");
    reconnect();
    // Serial.println("RESTART");
  }

  if (!transmitRadio()) {
    Serial.println("FAILED_RF_WRITE");
  } else {
    Serial.println("OK");
  }
}

// int channels[] = {81, 114};
int channels[] = {92, 103};

// To detect missing frames in the client
byte frameNumber = 0;

int bytesPerPixel = 3;
bool transmitRadio() {
  for (int k = 0; k < NUM_CHANNELS; k++) {
    int channel = channels[k];
    radio.setChannel(channel);

    int offset = k * bytesPerPixel * NUM_LEDS;

    for (int j = 0; j < NUM_LEDS;) {
      ledData[offset] = j;
      ledData[offset + 1] =
          frameNumber; // Clients can use it to detect missing packets

      if (!radio.write(&ledData[offset], 32)) {
        return false;
      }

      offset = offset + 30;
      j += 30 / bytesPerPixel;
    }
  }
  frameNumber++;
  return true;
}
