const createMultiProgram = require("../base-programs/MultiPrograms");
const { randomSchedule } = require("../joya-utils/preset");

const timeScale = 1; // RESET to 1 before commet.
const seconds = (1 / timeScale) * 1000;
const minutes = 60 * seconds;
const baseDuration = 30 * seconds;
const randomDuration = 5 * seconds;

class MetaSchedule {
  constructor() {
    this.schedules = {
      any: randomSchedule({
        presetsFile: 'joyahdtotems',
        mainShapes: ['joya', 'totems'],
        baseDuration,
        randomDuration,
      }),
      low: randomSchedule({
        presetsFile: 'joyahdtotems',
        mainShapes: ['joya', 'totems'],
        filter: (program, presetName, config) => config.tags && config.tags.includes("intensity-low"),
        baseDuration,
        randomDuration,
      }),
      mid: randomSchedule({
        presetsFile: 'joyahdtotems',
        mainShapes: ['joya', 'totems'],
        filter: (program, presetName, config) =>
          config.tags && config.tags.includes("intensity-mid"),
        baseDuration,
        randomDuration,
      }),
      high: randomSchedule({
        presetsFile: 'joyahdtotems',
        mainShapes: ['joya', 'totems'],
        filter: (program, presetName, config) =>
          config.tags && config.tags.includes("intensity-high"),
        baseDuration,
        randomDuration,
      }),
    };
    this.activeSchedule = "any";
  }

  schedule() {
    console.log(this.activeSchedule);
    return this.schedules[this.activeSchedule]();
  }
}

const metaSchedule = new MetaSchedule();

module.exports = class JoyaMusic extends (
  createMultiProgram(() => metaSchedule.schedule(), false, 5 * seconds)
) {
  init() {
    super.init();
    this.masks = {};
    for (const [name, shape] of Object.entries(this.shapeMapping())) {
      const mask = (this.masks[name] = new Array(this.numberOfLeds).fill(
        false
      ));
      for (const i of shape) {
        mask[i] = true;
      }
    }
  }

  drawFrame(leds, context) {
    super.drawFrame(leds, context);
    let mask = this.masks[this.config.mask];
    if (!mask) {
      mask = this.masks.all;
    }
    for (let i = 0; i < leds.length; i++) {
      if (!mask[i]) {
        leds[i] = [0, 0, 0];
      }
    }
  }

  updateConfig(newConfig) {
    if (this.masks && !(newConfig.mask in this.masks)) {
      console.warn(`unknown mask: ${newConfig.mask}`);
    }
    metaSchedule.activeSchedule = newConfig.intensity;
    this.startNextProgram();
    super.updateConfig(newConfig);
  }

  static configSchema() {
    return Object.assign(super.configSchema(), {
      intensity: {
        type: String,
        default: "high",
        values: ["low", "mid", "high", "any"],
      },
      mask: {
        type: String,
        default: "vertices",
        values: [
          "all",
          "joya",
          "totems",
          "vertices",
          "joya-odd-triangles",
          "joya-even-triangles",
          "joya-top-h",
        ],
      },
    });
  }

  static presets() {
    return {
      default: {},
      joyaParts: { mask: "joya-odd-triangles", intensity: "mid" },
      joyaMid: { mask: "joya", intensity: "mid" },
      mateMid: { mask: "totems", intensity: "mid" },
      todo: { mask: "all", intensity: "high" },
    };
  }
};
