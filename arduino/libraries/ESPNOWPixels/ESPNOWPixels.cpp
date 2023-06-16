#include "ESPNOWPixels.h"

#include <string_view>

namespace {

static constexpr size_t kEspNowMaxMsgLen = 250;
static constexpr size_t kHeaderSize = 4;
static constexpr size_t kMaxLedsPerPacket =
    (kEspNowMaxMsgLen - kHeaderSize) / 3;
static constexpr std::string_view kBeaconFormat = "BEACON%s";
static constexpr std::string_view kBeaconHeader = "BEACON";

}  // namespace

ESPNOWSender::ESPNOWSender(size_t pixels_per_client, size_t client_count)
    : pixels_per_client_(pixels_per_client), client_count_(client_count) {
  buf_.resize(kEspNowMaxMsgLen, 0);
}

bool ESPNOWSender::send(const CRGB* pixels, size_t length,
                        const ESPNOWSender::Callback& callback) {
  const size_t expected_length = pixels_per_client_ * client_count_;
  if (length != expected_length) {
    Serial.print("Expected ");
    Serial.print(expected_length);
    Serial.print(" pixels but got ");
    Serial.println(length);
  }
  const size_t packets_per_client =
      ceil(static_cast<float>(pixels_per_client_) / kMaxLedsPerPacket);
  for (size_t client = 0; client < client_count_; ++client) {
    const size_t client_offset = client * pixels_per_client_;
    for (size_t client_packet = 0; client_packet < packets_per_client;
         ++client_packet) {
      buf_[0] = 'W';  // Warro header.
      buf_[1] = seq_;
      buf_[2] = client;
      buf_[3] = client_packet;
      const size_t client_relative_offset = client_packet * kMaxLedsPerPacket;
      for (size_t i = 0; i < kMaxLedsPerPacket; ++i) {
        const size_t client_relative_i = client_relative_offset + i;
        const bool within_bounds = client_relative_i < pixels_per_client_;
        const size_t pixel_i = client_offset + client_relative_i;
        const CRGB& pixel = within_bounds ? pixels[pixel_i] : CRGB::Black;
        buf_[kHeaderSize + 3 * i + 0] = pixel.r;
        buf_[kHeaderSize + 3 * i + 1] = pixel.g;
        buf_[kHeaderSize + 3 * i + 2] = pixel.b;
      }
      if (!callback(buf_.data(), buf_.size())) {
        return false;
      }
    }
  }

  ++seq_;
  return true;
}

bool ESPNOWSender::sendBeacon(std::string_view hostname,
                              const Callback& callback) {
  char beacon[100];
  size_t length = sprintf(beacon, kBeaconFormat.data(), hostname.data());
  return callback(reinterpret_cast<uint8_t*>(beacon), length);
}

ESPNOWReceiver::ESPNOWReceiver(std::string_view gateway_hostname,
                               size_t pixel_count, uint8_t client_index,
                               const Callback& callback)
    : gateway_hostname_(gateway_hostname),
      pixels_(pixel_count, CRGB::Black),
      client_index_(client_index),
      callback_(callback),
      packets_per_frame_(
          std::ceil(static_cast<float>(pixel_count) / kMaxLedsPerPacket)),
      gateway_mac_{0x00, 0x00, 0x00, 0x00, 0x00, 0x00} {}

bool ESPNOWReceiver::handlePacket(
    const uint8_t mac[ESPNOWReceiver::kMacAddressLength], const uint8_t* data,
    size_t length) {
  if (!std::equal(mac, mac + kMacAddressLength, gateway_mac_)) {
    if (length < kBeaconHeader.size() + 1) {
      return false;
    }
    const std::string_view header(reinterpret_cast<const char*>(data),
                                  kBeaconHeader.size());
    if (header != kBeaconHeader) {
      return false;
    }
    const std::string_view hostname(
        reinterpret_cast<const char*>(data + kBeaconHeader.size()),
        length - kBeaconHeader.size());
    Serial.print("Got beacon with hostname: ");
    Serial.println(std::string(hostname.data(), hostname.size()).c_str());
    if (hostname == gateway_hostname_) {
      Serial.println("Matches expected hostname, ready to receive data.");
      std::copy(mac, mac + kMacAddressLength, gateway_mac_);
      return true;
    } else {
      Serial.println("Doesn't match expected hostname, ignoring.");
      return false;
    }
  }
  if (length < kHeaderSize) {
    return false;  // Too short.
  }
  if (data[0] != 'W') {
    return false;  // Invalid header.
  }
  if (data[2] != client_index_) {
    return false;  // Not for me.
  }
  const uint8_t seq = data[1];
  if (!current_seq_) {
    current_seq_ = seq;
  }
  ++current_stats_.message_count;
  ++current_stats_.frame_message_count;
  if (seq != *current_seq_) {
    const uint8_t diff = seq - *current_seq_;
    if (diff > 1) {
      Serial.print("Missed ");
      Serial.print(diff - 1);
      Serial.println(" whole frame(s).");
      current_stats_.missed_message_count += packets_per_frame_ * (diff - 1);
    }
    current_stats_.missed_message_count +=
        packets_per_frame_ - current_stats_.frame_message_count;
    current_stats_.frame_message_count = 0;
    current_seq_ = seq;

    if (!callback_(pixels_.data(), pixels_.size())) {
      return false;
    }
  }
  const uint8_t offset = data[3];
  for (size_t i = 0; i < kMaxLedsPerPacket; ++i) {
    const size_t led_i = static_cast<size_t>(offset) * kMaxLedsPerPacket + i;
    if (led_i >= pixels_.size()) {
      break;
    }
    CRGB& led = pixels_[led_i];
    led.r = data[kHeaderSize + 3 * i + 0];
    led.g = data[kHeaderSize + 3 * i + 1];
    led.b = data[kHeaderSize + 3 * i + 2];
  }
  return true;
}

ESPNOWReceiver::Stats ESPNOWReceiver::popStats() {
  auto stats = current_stats_;
  current_stats_ = Stats();
  return stats;
}