#ifndef _WARROUDP_H_
#define _WARROUDP_H_

#include <FastLED.h>
#include <Print.h>
#include <UDP.h>

#include <functional>
#include <vector>

class WarroUDPBase {
 public:
  using FrameCallback = std::function<void(CRGB*, size_t)>;

  explicit WarroUDPBase(size_t pixel_count, FrameCallback callback);

  // Call with UDP frame data.
  virtual bool handlePacket(const uint8_t* data, size_t length) = 0;

  bool broadcastAlive(
      const std::function<bool(const uint8_t*, size_t)>& callback);

  bool broadcastFps(
      size_t fps, const std::function<bool(const uint8_t*, size_t)>& callback);

 protected:
  void frameReady();

  const size_t pixel_count_;
  const FrameCallback frame_callback_;
  std::vector<CRGB> pixels_;
  bool got_first_packet_ = false;
  uint8_t expected_seq_;
};

class WarroUDP : public WarroUDPBase {
 public:
  using WarroUDPBase::WarroUDPBase;

  bool handlePacket(const uint8_t* data, size_t length) final;
};

class WarroChunkedUDP : public WarroUDPBase {
 public:
  using WarroUDPBase::WarroUDPBase;

  bool handlePacket(const uint8_t* data, size_t length) final;

 private:
  bool frame_sent_ = false;
};

#endif  // _WARROUDP_H_
