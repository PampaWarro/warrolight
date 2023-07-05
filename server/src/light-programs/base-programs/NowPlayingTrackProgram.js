const LightProgram = require("./LightProgram");
const logger = require("pino")(require('pino-pretty')());

module.exports = function createNowPlayingTrackProgram(
  trackMapping,
) {
  const defaultItem = trackMapping[""];
  if (!defaultItem) {
    throw `trackMapping ${JSON.stringify(trackMapping)} missing default key (empty string)`;
  }
  const nonDefaultMapping = {};
  for (const [key, value] of Object.entries(trackMapping)) {
    if (key === "") continue;
    nonDefaultMapping[key] = value;
  }
  return class NowPlayingTrackProgram extends LightProgram {
    constructor(...args) {
      super(...args);
      this.constructorArgs = args;
      this.currentTrack = null;
      this.current = this.instantiate(defaultItem);
    }

    instantiate(item) {
      const program = new item(item.extractDefaults(), ...this.constructorArgs.slice(1));
      program.init();
      return program;
    }

    maybeUpdate(context) {
      const track = context ? context.nowPlaying.title : null;
      if (this.currentTrack == track) return;
      this.currentTrack = track;
      if (!track) {
        this.current = this.instantiate(defaultItem);
        logger.info(`No track playing currently, using default: ${this.current}`);
        return;
      }
      let match = null;
      for (const [key, value] of Object.entries(nonDefaultMapping)) {
        if (track.includes(key)) {
          if (match) {
            logger.warn(`Track "${track}" matches multiple keys: ${key}, ${match}`);
          }
          this.current = this.instantiate(value);
          logger.info(`Track "${track}" matches key "${key}" with program: ${this.current}`);
          match = key;
        }
      }
      if (!match) {
        this.current = this.instantiate(defaultItem);
        logger.warn(`Track "${track}" doesn't match any keys, fallig back to default: ${this.current}`);
      }
    }

    drawFrame(leds, context) {
      this.maybeUpdate(context)
      // TODO: remove this forwarding somehow
      this.current.timeInMs = this.timeInMs;
      this.current.drawFrame(leds, context);
    }

    toString() {
      return `NowPlayingTrackProgram(${JSON.stringify(trackMapping)})`;
    }
  };
};

