const LightProgram = require("./LightProgram");
const logger = require("pino")(require('pino-pretty')());

module.exports = function createNowPlayingPositionProgram(programs) {
  if (!programs) throw "Need at least one program";
  return class NowPlayingPositionProgram extends LightProgram {
    constructor(...args) {
      super(...args);
      this.constructorArgs = args;
      this.livePrograms = {};
    }

    instantiate(item) {
      const program = new item(item.extractDefaults(), ...this.constructorArgs.slice(1));
      program.init();
      return program;
    }

    updateLivePrograms(context) {
      const time = context ? context.nowPlaying.time : 0;
      const length = context ? context.nowPlaying.length : 0;
      for (let i = 0; i < programs.length; i++) {
        const entry = programs[i];
        let match = true;
        if (entry.start !== undefined && time < entry.start) {
          match = false;
        }
        if (entry.end !== undefined && time > entry.end) {
          match = false;
        }
        if (match && !(i in this.livePrograms)) {
          this.livePrograms[i] = {
            instance: this.instantiate(entry.program),
            leds: new Array(this.numberOfLeds).fill([0, 0, 0]),
            brightness: 1,
          }
        }
        if (!match && (i in this.livePrograms)) {
          delete this.livePrograms[i];
        }
        if (match) {
          let brightness = 1;
          if (entry.fadeIn !== undefined) {
            const timeSinceStart = entry.start !== undefined ? time - entry.start : time;
            if (timeSinceStart < entry.fadeIn) {
              brightness = Math.min(brightness, timeSinceStart / entry.fadeIn);
            }
          }
          if (entry.fadeOut !== undefined) {
            const timeUntilEnd = entry.end !== undefined ? entry.end - time : length - time;
            if (timeUntilEnd >= 0 && timeUntilEnd < entry.fadeOut) {
              brightness = Math.min(brightness, timeUntilEnd / entry.fadeOut);
            }
          }
          this.livePrograms[i].brightness = brightness;
        }
      }
    }

    drawFrame(leds, context) {
      this.updateLivePrograms(context);
      const livePrograms = Object.values(this.livePrograms);
      for (const program of livePrograms) {
        // TODO: remove this forwarding somehow
        program.instance.timeInMs = this.timeInMs;
        program.instance.drawFrame(program.leds, context);
      }
      for (let i = 0; i < this.numberOfLeds; i++) {
        const led = [0, 0, 0];
        for (const program of livePrograms) {
          const programLed = program.leds[i];
          led[0] = Math.max(led[0], programLed[0] * program.brightness);
          led[1] = Math.max(led[1], programLed[1] * program.brightness);
          led[2] = Math.max(led[2], programLed[2] * program.brightness);
        }
        leds[i] = led;
      }
    }

    toString() {
      return `NowPlayingPositionProgram(${JSON.stringify(programs)})`;
    }
  };
};
