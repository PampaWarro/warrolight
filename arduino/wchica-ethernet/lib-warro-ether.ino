#include <SPI.h>        
#include <UIPEthernet.h>

IPAddress myDns(192, 168, 1, 1);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

unsigned int localPort = 5555; // local port to listen on

// buffers for receiving and sending data
//char ReplyBuffer[] = "acknowledged";       // a string to send back

// An EthernetUDP instance to let us send and receive packets over UDP
EthernetUDP udp;

void setupUDPConnection(unsigned int port, byte ipSegment) {
  // MAC address and IP address (in case DHCP fails)
  byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, ipSegment };
  localPort = port;

    // start the Ethernet and UDP:
  IPAddress useIp(192, 168, 1, ipSegment);
  Ethernet.begin(mac, useIp, myDns, gateway, subnet);
  /*Serial.println("Trying to get an IP address using DHCP");
  if (Ethernet.begin(mac) == 0) {
    Serial.println("Failed to configure Ethernet using DHCP...");
    // initialize the Ethernet device not using DHCP:
    Ethernet.begin(mac, ip, myDns, gateway, subnet);
  }*/
  
  Serial.print("My IP address: ");
  IPAddress ip = Ethernet.localIP();
  for (byte thisByte = 0; thisByte < 4; thisByte++) {
    // print the value of each byte of the IP address:
    Serial.print(ip[thisByte], DEC);
    Serial.print(".");
  }
  Serial.println("");
  
  udp.begin(localPort);

  withIp = true;
  
  broadcastAlive();
}

void broadcastAlive() {
  Serial.println("Broadcasting I exist...");
  IPAddress remoteIp(255, 255, 255, 255);
  udp.beginPacket(remoteIp, localPort);
  udp.write("YEAH");
  udp.endPacket();
}

void broadcastPerf(int frames) {
  IPAddress remoteIp(255, 255, 255, 255);
  udp.beginPacket(remoteIp, localPort);
  udp.write("PERF");
  String framesString = String(frames);
  char frameChar[5];
  framesString.toCharArray(frameChar, 5);
  udp.write(frameChar);
  udp.endPacket();

  Serial.print("Broadcasting PERF ");
  Serial.println(frameChar);
}

int count = 0;
byte lastC = 0;


bool checkForNewUDPMsg(char packetBuffer[]) {
  int packetSize = udp.parsePacket();

  if (packetSize == 0) {
    return false;
  }

  //Serial.print("Received packet of size ");       
  //Serial.println(packetSize);
  
  udp.read(packetBuffer,packetSize);

  byte c = packetBuffer[0];
  if(c - lastC > 1) {
    Serial.print("Missed ");
    Serial.print(c - lastC - 1, DEC);
    Serial.print(" - packet #");
    Serial.println(c, DEC);
  }  
    
  if((c % 50) == 0){
    //Serial.print("Received packet #");
    //Serial.println(c, DEC);
  }

  lastC = c;

  /*
  Serial.print(" from IP : ");
  IPAddress remote = udp.remoteIP();
  //print out the remote connection's IP address
  Serial.print(remote);

  Serial.print(" on port : ");
  //print out the remote connection's port
  Serial.println(udp.remotePort());

  udp.beginPacket(remote, udp.remotePort());
  udp.write("OK");
  udp.endPacket();
  */
  return true;
}
