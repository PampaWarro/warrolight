#ifndef _ESP_NOW_PIXELS_H
#define _ESP_NOW_PIXELS_H

#include <FastLED.h>

#include <functional>
#include <string>
#include <string_view>
#include <vector>

class ESPNOWSender {
 public:
  using Callback = std::function<bool(const uint8_t*, size_t)>;
  explicit ESPNOWSender(size_t pixels_per_client, size_t client_count);

  bool send(const CRGB* pixels, size_t length, const Callback& callback);
  bool sendBeacon(std::string_view hostname, const Callback& callback);

 private:
  const size_t pixels_per_client_;
  const size_t client_count_;
  const size_t total_pixels_ = pixels_per_client_ * client_count_;
  uint8_t seq_ = 0;
  std::vector<uint8_t> buf_;
};

class ESPNOWReceiver {
 public:
  static constexpr size_t kMacAddressLength = 6;

  using Callback = std::function<bool(const CRGB*, size_t)>;
  struct Stats {
    size_t message_count = 0;
    size_t frame_message_count = 0;
    size_t missed_message_count = 0;
  };

  explicit ESPNOWReceiver(std::string_view gateway_hostname, size_t pixel_count,
                          uint8_t client_index, const Callback& callback);

  bool handlePacket(const uint8_t mac[kMacAddressLength], const uint8_t* data,
                    size_t length);
  Stats popStats();

 private:
  std::string gateway_hostname_;
  std::vector<CRGB> pixels_;
  const uint8_t client_index_;
  const Callback callback_;
  const size_t packets_per_frame_;
  uint8_t gateway_mac_[kMacAddressLength];
  std::optional<uint8_t> current_seq_;
  Stats current_stats_;
};

#endif  // _ESP_NOW_PIXELS_H
