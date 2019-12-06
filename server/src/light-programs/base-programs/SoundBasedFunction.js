const TimeTickedFunction = require("./TimeTickedFunction");
const ProcessedAudioFrame = require("./ProcessedAudioFrame");
const soundAnalyzer = require("../../soundAnalyzer");

const AUDIO = new ProcessedAudioFrame();

soundAnalyzer.on("processedaudioframe", frame => AUDIO.update(frame));

module.exports = class SoundBasedFunction extends TimeTickedFunction {
  constructor(config, leds) {
    super(config, leds);
  }

  step(draw) {
    this.drawFrame(draw, AUDIO);
  }

  // Override and extend config Schema
  static configSchema() {
    let config = super.configSchema();
    return config;
  }
};
