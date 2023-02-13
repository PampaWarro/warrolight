/*
 * WebSocketClient.ino
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>

WebSocketsClient webSocket;

#define WIFI_SSID "Monasterio Mesh" // Brillitos
#define WIFI_PASS "batatamacabra" // rinocerontes
//#define WARRO_SERVER "multivac.local"
#define WARRO_SERVER "192.168.86.70" // 192.168.1.131
#define DEBUG true

#define USE_SERIAL Serial
#define MESSAGE1 "[\"tap\",{\"client\": \"drum\"}]"
#define MESSAGE2 "[\"tap\",{\"client\": \"party\"}]"
#define MESSAGE3 "[\"updateConfigParam\",{\"pote1\":%.2f}]"
#define MESSAGE4 "[\"updateConfigParam\",{\"pote2\":%.2f}]"

#define MAX_POTE 4095

int pot1 = 0;
int pot2 = 0;
int button1 = 0;
int button2 = 0;

char *message_buffer = (char*)malloc(40 * sizeof(char));

// Websocket handler
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      USE_SERIAL.printf("[WSc] Disconnected!\n");
      break;
    case WStype_CONNECTED:
      USE_SERIAL.printf("[WSc] Connected to url: %s\n", payload);
      break;
    case WStype_TEXT:
      USE_SERIAL.printf("[WSc] get text: %s\n", payload);
      break;
    case WStype_BIN:
      USE_SERIAL.printf("[WSc] get binary length: %u\n", length);
      break;
    case WStype_PING:
      // pong will be send automatically
      USE_SERIAL.printf("[WSc] get ping\n");
      break;
    case WStype_PONG:
      // answer to a ping we send
      USE_SERIAL.printf("[WSc] get pong\n");
      break;
    }
}

void setup() {
  pinMode(25, INPUT_PULLUP);
  pinMode(26, INPUT_PULLUP);
  
  // USE_SERIAL.begin(921600);
  USE_SERIAL.begin(115200);

  //Serial.setDebugOutput(true);
  USE_SERIAL.setDebugOutput(true);

  USE_SERIAL.println();
  USE_SERIAL.println();
  USE_SERIAL.println();

  for(uint8_t t = 4; t > 0; t--) {
    USE_SERIAL.printf("[SETUP] BOOT WAIT %d...\n", t);
    USE_SERIAL.flush();
    delay(1000);
  }
  
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  //WiFi.disconnect();
  while(WiFi.begin() != WL_CONNECTED) {
    delay(100);
  }
  USE_SERIAL.printf("[SETUP] Connected to %s\n", WIFI_SSID);

  // server address, port and URL
  webSocket.begin(WARRO_SERVER, 8080, "/ws");

  // event handler
  webSocket.onEvent(webSocketEvent);

  // use HTTP Basic Authorization this is optional remove if not needed
  //webSocket.setAuthorization("user", "Password");

  // try ever 5000 again if connection has failed
  webSocket.setReconnectInterval(5000);
  
  // start heartbeat (optional)
  // ping server every 15000 ms
  // expect pong from server within 3000 ms
  // consider connection disconnected if pong is not received 2 times
  //webSocket.enableHeartbeat(15000, 3000, 2);

  pot1 = analogRead(36);
  pot2 = analogRead(39);
  button1 = button2 = 0;
}

void loop() {
  delay(50);

  webSocket.loop();

  // read entries, evaluate change, snap potes to min/max
  int new_pot1 = analogRead(36);
  bool pot1_changed = abs(pot1 - new_pot1) > 150;
  new_pot1 = new_pot1 < 150 ? 0 : new_pot1;
  new_pot1 = new_pot1 > (MAX_POTE - 150) ? MAX_POTE : new_pot1;

  int new_pot2 = analogRead(39);
  bool pot2_changed = abs(pot2 - new_pot2) > 150;
  new_pot2 = new_pot2 < 150 ? 0 : new_pot2;
  new_pot2 = new_pot2 > (MAX_POTE - 150) ? MAX_POTE : new_pot1;

  int new_button1 = digitalRead(25) == 0;
  bool button1_changed = button1 != new_button1;

  int new_button2 = digitalRead(26) == 0;
  bool button2_changed = button2 != new_button2;

  if((pot1_changed || pot2_changed || button1_changed || button2_changed )) {
      
      pot1 = new_pot1;
      pot2 = new_pot2;
      button1 = new_button1;
      button2 = new_button2;
  
    if (button1_changed && button1){
      USE_SERIAL.println("[SEND] Tap 1");
      webSocket.sendTXT(MESSAGE1);
    }

    if (button2_changed && button2){
      USE_SERIAL.println("[SEND] Tap 2");
      webSocket.sendTXT(MESSAGE2);
    }

    if (pot1_changed){
      float value = 1.0 * pot1 / MAX_POTE;
      sprintf(message_buffer, MESSAGE3, value);
      USE_SERIAL.printf("[SEND] %s\n", message_buffer);
      webSocket.sendTXT(message_buffer);
    }

    if (pot2_changed){
      float value = 1.0 * pot2 / MAX_POTE;
      sprintf(message_buffer, MESSAGE4, value);
      USE_SERIAL.printf("[SEND] %s\n", message_buffer);
      webSocket.sendTXT(message_buffer);
    }
  }
}

void printState() {
  USE_SERIAL.printf("State: %d %d %d %d\n", button1, button2, pot1, pot2);
}