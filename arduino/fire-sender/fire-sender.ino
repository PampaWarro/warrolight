
#include <SPI.h>
#include "nRF24L01.h"
#include "RF24.h"

RF24 radio(7,8);

const uint64_t pipe = 0xE14BC8F482LL;
byte DataMsg[3];
int Button1 = 2;
int Button2 = 3;
int Button3 = 4;
int Button4 = 5;
int Button5 = 6;

byte c = 1;
byte dataStart = 0;

bool lastMetralla1 = true;
long lastMetralla = 0;
bool left = false;
bool right = false;
bool btnPress = false;

void metralleta (int tOn, int t, bool alternate = false)
{
  if (millis() - lastMetralla < tOn){
    if (alternate){
      sendMessage(lastMetralla1, !lastMetralla1);
    } else {
      sendMessage(true, true);
    }
  }
  if (millis() - lastMetralla > tOn){
      sendMessage(false, false);
  }
  if(millis() - lastMetralla > t)
  {
    lastMetralla = millis();
    lastMetralla1 = !lastMetralla1;
  }
}


void sendMessage(int msg0, int msg1)
{
  c++;
  Serial.print("Sending: ");
  Serial.print(c);
  Serial.print(" , ");
  Serial.print(msg0);
  Serial.println(msg1);
  
  DataMsg[0] = c;
  DataMsg[1] = msg0;
  DataMsg[2] = msg1;
  
  radio.write(DataMsg, 3);
}

void setup()
{
  //ativa pull-up
  pinMode(2, INPUT_PULLUP);
  pinMode(3, INPUT_PULLUP);
  pinMode(4, INPUT_PULLUP);
  pinMode(5, INPUT_PULLUP);
  pinMode(6, INPUT_PULLUP);
  

  Serial.begin(57600);
  Serial.println("NRF24L01 Transmitter");
  radio.begin();
  radio.setDataRate(RF24_250KBPS);
  radio.setPayloadSize(32);
  //radio.setAutoAck(false);
  radio.setChannel(50);
  radio.setPALevel(RF24_PA_HIGH);
  radio.openWritingPipe(pipe);
  radio.stopListening();
  
}

void loop()
{
  while (true){
    
    left = !digitalRead(Button1); //LOW es apretado
    right = !digitalRead(Button5);
    
    if (left || right) 
    {
      sendMessage(left, right);
      btnPress = true;
      continue;
    }
    if (digitalRead(Button2) == LOW)
    {
      metralleta(90, 520, false);
      continue;
    }
    if (digitalRead(Button3) == LOW)
    {
      metralleta(100, 200, false);
      //sendMessage(1,1);
      continue;
    }
    if (digitalRead(Button4) == LOW)
    {
      metralleta(100, 200, true);
      //sendMessage(1,1);
      continue;
    }
    
    if(btnPress)
    {
      btnPress = false;
      sendMessage(0,0);
    }
  }
}
