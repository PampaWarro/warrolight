
#include <SPI.h>
#include "nRF24L01.h"
#include "RF24.h"

//definicición de uso de las salidas, hay módulos de relay que se activan por LOW y otros por HIGH
#define on LOW
#define off HIGH
int Puffer1 = 2;
int Relay1 = 3;
int Puffer2 = 4;
int Relay2 = 5;

long lastPuf1 = 0;
long lastPuf2 = 0;
//byte DataMgs[4];
struct receivedData {
  byte c;
  byte poof1;
  byte poof2;
};

receivedData DataMgs;

byte lastC;
RF24 radio(7,8);
const uint64_t pipe = 0xE14BC8F482LL;


void setup()
{
  Serial.begin(57600);
  Serial.println("Starting");
  pinMode(Puffer1, OUTPUT);
  pinMode(Puffer2, OUTPUT);
  pinMode(Relay1, OUTPUT);
  pinMode(Relay2, OUTPUT);
  digitalWrite(Puffer1, off);
  digitalWrite(Puffer2, off);
  digitalWrite(Relay1, off);
  digitalWrite(Relay2, off);
  
  radio.begin();
  radio.setDataRate(RF24_250KBPS);
  radio.setPayloadSize(32);
  radio.openReadingPipe(1,pipe);
  //radio.setAutoAck(false);
  radio.setChannel(50);
  radio.startListening();
  Serial.println("Waiting for fire...");
}

void setPuffer(int puf, bool state)
{
  if (state == on && puf == Puffer1) lastPuf1 = millis();
  if (state == on && puf == Puffer2) lastPuf2 = millis();
  digitalWrite(puf, state);
  if (puf == Puffer1) digitalWrite(Relay1, state);
  if (puf == Puffer2) digitalWrite(Relay2, state);
}

void checkActivePuffers()
{
  if (millis() - lastPuf1 > 50) setPuffer(Puffer1,off);
  if (millis() - lastPuf2 > 50) setPuffer(Puffer2,off);
}

void loop()
{
  if (radio.available())
  {
    //Serial.println("Has data!"); 
      radio.read(&DataMgs, sizeof(DataMgs));
      if (DataMgs.c != lastC) //hacer andar protección para no leer dos veces el mismo paquete
      {
        Serial.print("Receiving: ");    
        Serial.print(DataMgs.c);
        Serial.print(" ");   
        Serial.print(DataMgs.poof1);
        Serial.println(DataMgs.poof2);
        
        setPuffer(Puffer1, DataMgs.poof1 ? on : off); //activate / de-activate output relays
        setPuffer(Puffer2, DataMgs.poof2 ? on : off);
        lastC = DataMgs.c;
      }
  }
  checkActivePuffers(); //protección para que no quede mucho tiempo prendido
  //delay(50);
}
