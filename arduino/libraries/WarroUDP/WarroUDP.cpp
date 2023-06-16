#include "WarroUDP.h"

namespace {

static constexpr uint8_t kEncodingRgb = 4;
static constexpr size_t kMaxLedsPerChunk = 300;

}  // namespace

WarroUDPBase::WarroUDPBase(size_t pixel_count,
                           WarroUDPBase::FrameCallback frame_callback)
    : pixel_count_(pixel_count),
      frame_callback_(frame_callback),
      pixels_(pixel_count, CRGB::Black) {}

bool WarroUDPBase::broadcastAlive(
    const std::function<bool(const uint8_t*, size_t)>& callback) {
  static constexpr std::string_view kYeah = "YEAH";
  return callback(reinterpret_cast<const uint8_t*>(kYeah.data()), kYeah.size());
}

bool WarroUDPBase::broadcastFps(
    size_t fps, const std::function<bool(const uint8_t*, size_t)>& callback) {
  char perf[50];
  size_t length = sprintf(perf, "PERF%i", fps);
  return callback(reinterpret_cast<const uint8_t*>(perf), length);
}

void WarroUDPBase::frameReady() {
  frame_callback_(pixels_.data(), pixels_.size());
}

bool WarroUDP::handlePacket(const uint8_t* data, size_t length) {
  static constexpr size_t kHeaderLength = 2;
  if (length < kHeaderLength) {
    Serial.print("UDP packet too short: ");
    Serial.println(length);
    return false;
  }
  const uint8_t seq = data[0];
  if (!got_first_packet_) {
    got_first_packet_ = true;
    expected_seq_ = seq;
  }
  if (expected_seq_ != seq) {
    Serial.print("Missed ");
    Serial.print(seq - expected_seq_);
    Serial.println(" UDP packets.");
  }
  expected_seq_ = seq + 1;
  const uint8_t encoding = data[1];
  if (encoding != kEncodingRgb) {
    Serial.print("Unexpected encoding: ");
    Serial.println(encoding);
    return false;
  }
  const size_t pixel_data_length = length - kHeaderLength;
  if (pixel_data_length % 3 != 0) {
    Serial.print("Pixel data not divisible by 3: ");
    Serial.println(pixel_data_length);
    return false;
  }
  const size_t pixel_count = pixel_data_length / 3;
  if (pixel_count != pixel_count_) {
    Serial.print("Expected ");
    Serial.print(pixel_count_);
    Serial.print(" pixels, but got ");
    Serial.print(pixel_count);
  }
  for (size_t i = 0; i < pixel_count; ++i) {
    if (i >= pixel_count_) {
      break;
    }
    CRGB& led = pixels_[i];
    led.r = data[kHeaderLength + 3 * i + 0];
    led.g = data[kHeaderLength + 3 * i + 1];
    led.b = data[kHeaderLength + 3 * i + 2];
  }
  frameReady();
  return true;
}

bool WarroChunkedUDP::handlePacket(const uint8_t* data, size_t length) {
  static constexpr size_t kHeaderLength = 3;
  if (length < kHeaderLength) {
    Serial.print("UDP packet too short: ");
    Serial.println(length);
    return false;
  }
  const uint8_t seq = data[0];
  if (!got_first_packet_) {
    got_first_packet_ = true;
    expected_seq_ = seq;
  }
  if (expected_seq_ != seq) {
    Serial.print("Missed ");
    Serial.print(seq - expected_seq_);
    Serial.println(" UDP packets.");
  }
  expected_seq_ = seq + 1;
  const uint8_t chunk = data[1];
  if (chunk == 0) {
    if (!frame_sent_) {
      frameReady();
      EVERY_N_SECONDS(10) {
        Serial.println("Input frame too short, check server config.");
      }
    } else {
      frame_sent_ = false;
    }
  }
  const uint8_t encoding = data[2];
  if (encoding != kEncodingRgb) {
    Serial.print("Unexpected encoding: ");
    Serial.println(encoding);
    return false;
  }
  const size_t pixel_data_length = length - kHeaderLength;
  if (pixel_data_length % 3 != 0) {
    Serial.print("Pixel data not divisible by 3: ");
    Serial.println(pixel_data_length);
    return false;
  }
  const size_t pixel_count = pixel_data_length / 3;
  for (size_t i = 0; i < pixel_count; ++i) {
    size_t pixel_i = chunk * kMaxLedsPerChunk + i;
    if (pixel_i >= pixel_count_) {
      break;
    }
    CRGB& led = pixels_[pixel_i];
    led.r = data[kHeaderLength + 3 * i + 0];
    led.g = data[kHeaderLength + 3 * i + 1];
    led.b = data[kHeaderLength + 3 * i + 2];
  }
  if (chunk == (pixel_count_ / kMaxLedsPerChunk) - 1) {
    frameReady();
    frame_sent_ = true;
  }
  return true;
}
