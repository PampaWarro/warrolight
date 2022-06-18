try {
  const { AudioInput, listDevices } = require("./rtaudioInput");
  module.exports = {
    AudioInput,
    listDevices,
  };
} catch (err) {
  console.error(
    "Failed to load rtaudio based audio input, using python fallback:",
    err
  );
  const { AudioInput, listDevices } = require("./pythonFallbackInput");
  module.exports = {
    AudioInput,
    listDevices,
  };
}
