#ifndef _WARROUDP_H_
#define _WARROUDP_H_

#include <FastLED.h>
#include <Print.h>
#include <UDP.h>

#include <vector>

namespace warrolight {

class WarroUDP {
 public:
  explicit WarroUDP(Print& std_print, UDP& udp, uint16_t remote_port,
                    size_t pixel_count);
  bool readFrame(CRGB* leds);
  void broadcastAlive();
  bool connected() const;

 private:
  bool readPacket();
  bool writeLedFrame(size_t offset, CRGB* leds);
  void broadcastPerf(size_t frames);

  Print& std_print_;
  UDP& udp_;
  const uint16_t remote_port_;
  const size_t pixel_count_;
  std::vector<uint8_t> buffer_;
  uint8_t last_packet_ = 0;
  bool connected_ = false;
};

}  // namespace warrolight

#endif  // _WARROUDP_H_
