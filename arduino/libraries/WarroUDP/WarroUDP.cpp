#include "WarroUDP.h"

#include <Arduino.h>
#include <IPAddress.h>

namespace warrolight {
namespace {

static const IPAddress kBroadcastIP{255, 255, 255, 255};
static constexpr uint8_t kEncodingRgb = 4;

}  // namespace

WarroUDP::WarroUDP(Print& std_print, UDP& udp, uint16_t remote_port,
                   size_t pixel_count)
    : std_print_(std_print),
      udp_(udp),
      remote_port_(remote_port),
      pixel_count_(pixel_count),
      buffer_(3 * pixel_count + 2) {}

bool WarroUDP::readFrame(CRGB* leds) {
  if (!readPacket()) {
    return false;
  }
  return writeLedFrame(1, leds);
}

bool WarroUDP::readPacket() {
  static size_t packet_count = 0;
  const unsigned long current_millis = millis();
  static unsigned long last_broadcast_millis = 0;
  static unsigned long last_frame_millis = 0;
  static unsigned long last_perf_millis = 0;
  if (current_millis - last_broadcast_millis > 1000) {
    broadcastAlive();
    last_broadcast_millis = current_millis;
  }
  const int packet_size = udp_.parsePacket();
  if (packet_size <= 0) {
    if (current_millis - last_frame_millis > 1000) {
      connected_ = false;
    }
    return false;
  }
  if (static_cast<size_t>(packet_size) > buffer_.size()) {
    std_print_.println("Packet larger than buffer, ignoring...");
    return false;
  }
  const int bytes_read = udp_.read(buffer_.data(), packet_size);
  if (bytes_read < packet_size) {
    std_print_.println("Read less bytes than packet size, ignoring...");
    return false;
  }
  uint8_t packet_id = buffer_[0];
  if (packet_id - last_packet_ > 1) {
    std_print_.printf("Dropped %d packets.\n", packet_id - last_packet_ - 1);
  }
  last_packet_ = packet_id;
  if (packet_count > 0 && (current_millis - last_perf_millis > 1000)) {
    broadcastPerf(packet_count);
    packet_count = 0;
    last_perf_millis = current_millis;
  }
  ++packet_count;
  connected_ = true;
  last_frame_millis = current_millis;
  return true;
}

void WarroUDP::broadcastAlive() {
  std_print_.println("Broadcasting I exist...");
  udp_.beginPacket(kBroadcastIP, remote_port_);
  udp_.write(reinterpret_cast<const uint8_t*>("YEAH"), 4);
  udp_.endPacket();
}

bool WarroUDP::connected() const { return connected_; }

bool WarroUDP::writeLedFrame(size_t offset, CRGB* leds) {
  const uint8_t encoding = buffer_[0 + offset];
  if (encoding == kEncodingRgb) {
    for (size_t i = 0; i < pixel_count_; i++) {
      const uint8_t r = buffer_[1 + i * 3 + offset];
      const uint8_t g = buffer_[1 + 1 + i * 3 + offset];
      const uint8_t b = buffer_[1 + 2 + i * 3 + offset];

      leds[i].setRGB(r, g, b);
    }
    return true;
  } else {
    std_print_.println("Unexpected encoding byte");
    return false;
  }
}

void WarroUDP::broadcastPerf(size_t frames) {
  std_print_.print("Broadcasting PERF ");

  udp_.beginPacket(kBroadcastIP, remote_port_);
  udp_.write(reinterpret_cast<const uint8_t*>("PERF"), 4);
  String framesString = String(frames);
  char frameChar[5];
  framesString.toCharArray(frameChar, 5);
  udp_.write(reinterpret_cast<const uint8_t*>(frameChar), 5);
  udp_.endPacket();

  std_print_.println(frameChar);
}

}  // namespace warrolight
