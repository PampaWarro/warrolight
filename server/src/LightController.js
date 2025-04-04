const _ = require("lodash");
const EventEmitter = require("events");
const fs = require("fs");
const moment = require("moment");
const logger = require("pino")(require('pino-pretty')());

const ProgramScheduler = require("./ProgramScheduler");
const {makeFXProgram} = require("./light-programs/base-programs/FX");

// TODO: move this to some configuration file
const programNames = [
  "PALO",
  "mix",
  // "congaShooting2",
  // "congaScore",
  // "congaShooting",
  // "congaRope",
  // "PROGRAM_Triangulo",
  // "PROGRAM_Transition",
  "aliveDots",
  "aliveDotsSpeed",
  "all-white",
  "all-off",
  "hsv",
  "bandParticles",
  "bassWarpGrid",
  "bombs",
  "ca",
  "circles",
  "debugSetup",
  "debugShapes",
  "dynamicMask",
  "frequencyActivation",
  "gradientSphere",
  "lineal",
  "musicFlow",
  "music-flow-waves",
  "musicFlash",
  "musicFrequencyDot",
  "musicExplosions",
  "musicVolumeBars",
  "musicVolumeDot",
  "musicVolumeDotRandom",
  "noise",
  "polar",
  "randomShapes",
  "radial",
  "radial3d",
  "radialSun",
  "radialWarp",
  "rainbow",
  "rays",
  "relampejo",
  "shapes",
  "sound-waves",
  "stars",
  "stripe-patterns",
  "vertexGlow",
  "warroBass",
  "water-flood",
  "waveform",
  "waveform2",
];

module.exports = class LightController extends EventEmitter {
  constructor(multiplexer, geometry, shapeMapping, presetsFile) {
    super();
    this.savedPresetsFilePath = `${__dirname}/../setups/program-presets/${presetsFile}.json`;
    if (!fs.existsSync(this.savedPresetsFilePath)) {
      fs.writeFileSync(this.savedPresetsFilePath, "{}");
    }
    this.savedPresets = require(this.savedPresetsFilePath)
    logger.info(`Loaded presets from ${presetsFile}.`);

    this.multiplexer = multiplexer;
    this.geometry = geometry;
    this.shapeMapping = shapeMapping;

    this.leds = new Array(geometry.leds).fill([0, 0, 0]);

    this.programs = _.keyBy(_.map(programNames, this.loadProgram), "name");
    this.setCurrentProgram(programNames[0]);

    this.multiplexer.onDeviceStatus((...args) => this.emit('deviceStatus', ...args));

    this.lastLightsUpdate = Date.now();
    this.lastDroppedFrame = Date.now();
  }

  getProgramsSchema() {
    return _.map(this.programs, p => {
      return {
        name: p.name,
        config: p.configSchema,
        presets: _.keys(this.getProgramPresets(p.name))
      };
    });
  }

  getCurrentConfig() {
    if (this.programScheduler) {
      return this.currentConfig
    } else {
      return {}
    }
  }

  getProgramPresets(programName) {
    const program = this.programs[programName];
    if(program) {
      let presets = this.savedPresets[programName] || {};

      if(program.generator.presets) {
        presets = { ... program.generator.presets(), ... presets };
      }
      return presets;
    } else {
      return {}
    }
  }

  getProgramDefaultParams(programName) {
    let configSchema = this.programs[programName].configSchema;
    return _.mapValues(configSchema, 'default')
  }

  getCurrentPresets() {
    if (this.programScheduler) {
      return this.getProgramPresets(this.currentProgramName);
    } else {
      return {};
    }
  }

  start() {
    if (this.programScheduler) {
      this.currentConfig = this.buildParameters(this.programs[this.currentProgramName].configSchema);
      this.currentDebugHelpers = this.programScheduler.getDebugHelpers();
      this.programScheduler.start();
      this.running = true;
    }
  }

  restart() {
    this.programScheduler.restart();
  }

  stop() {
    this.running = false;
    if (this.programScheduler) {
      this.programScheduler.stop();
    }
  }

  setLights(colorArray) {
    this.multiplexer.setLights(colorArray);
  }

  getConfig({ defaults, presetOverrides, overrides, currentPreset }) {
    return { ...defaults, ...presetOverrides, ...overrides };
  }

  buildParameters(configSchema, presetOverrides = {}, presetName = null, overrides = {}) {
    let defaults = {};

    for (let paramName in configSchema) {
      if (defaults[paramName] === undefined && configSchema[paramName].default !== undefined) {
        defaults[paramName] = configSchema[paramName].default;
      }
    }
    return { defaults, presetOverrides, currentPreset: presetName, overrides };
  }

  updateConfigOverride(config) {
    let configSchema = this.programs[this.currentProgramName].configSchema;
    let { presetOverrides, currentPreset, overrides } = this.currentConfig;
    this.currentConfig = this.buildParameters(configSchema, presetOverrides, currentPreset, { ...overrides, ...config })
    this.programScheduler.updateConfig(this.getConfig(this.currentConfig));
    this.currentDebugHelpers = this.programScheduler.getDebugHelpers();
  }

  setPreset(presetName) {
    const presets = this.getCurrentPresets();

    const presetOverrides = presets[presetName];
    if (!presetOverrides) {
      console.warn(`Selected preset ${presetName} not found.`)
      return;
    }

    let configSchema = this.programs[this.currentProgramName].configSchema;

    this.currentConfig = this.buildParameters(configSchema, presetOverrides, presetName, {})
    this.programScheduler.updateConfig(this.getConfig(this.currentConfig));
    this.currentDebugHelpers = this.programScheduler.getDebugHelpers();
  }

  savePreset(programName, presetName, config) {
    this.savedPresets[programName] = this.savedPresets[programName] || {}
    this.savedPresets[programName][presetName] = config;

    this.savePresetsToDisk();
  }

  deletePreset(programName, presetName) {
    this.savedPresets[programName] = this.savedPresets[programName] || {}
    delete this.savedPresets[programName][presetName];
    this.savePresetsToDisk();

    this.currentConfig.currentPreset = null;
  }

  savePresetsToDisk() {
    fs.writeFile(this.savedPresetsFilePath, JSON.stringify(this.savedPresets, true, 4), (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Updated presets file ${this.savedPresetsFilePath}`)
      }
    });
  }

  instanciateProgram(name, extraConfig) {
    let program = this.programs[name];
    let config = this.getConfig(this.buildParameters(program.configSchema, {}, null, extraConfig));
    return new program.generator(
      config,
      this.geometry,
      this.shapeMapping,
      this
    )
  }

  setCurrentProgram(name) {
    let selectedProgram = this.programs[name];
    if (!selectedProgram) {
      console.warn(`Selected program ${name} not found.`)
      return;
    }

    if (this.running && this.programScheduler) {
      this.programScheduler.stop();
    }
    this.currentProgramName = name;
    let program = this.programs[name];

    this.currentConfig = this.buildParameters(program.configSchema)
    let config = this.getConfig(this.currentConfig);

    this.programScheduler = new ProgramScheduler(
      new program.generator(
        config,
        this.geometry,
        this.shapeMapping,
        this
      ),
      config,
      this.leds,
      this.updateLeds.bind(this)
    );
    if (this.running) {
      this.start();
    }
  }

  loadProgram(name) {
    // const FunctionClass = makeFXProgram(require("./light-programs/programs/" + name));
    const FunctionClass = require("./light-programs/programs/" + name);
    return {
      name: name,
      configSchema: FunctionClass.configSchema(),
      generator: FunctionClass
    };
  }

  updateLeds(leds) {
    this.emit("lights", leds);

    this.setLights(leds);
    let lastUpdateLatency = Date.now() - this.lastLightsUpdate;
    this.lastLightsUpdate = Date.now();

    const frameDurationMS = 1000 / this.programScheduler.config.fps;

    if (lastUpdateLatency > frameDurationMS * 2) {
      console.warn(
        `[${moment().format(
          "HH:mm:ss"
        )}] Dropped frame: Last one took ${lastUpdateLatency}ms (instead of ${Math.round(frameDurationMS)}ms)  [after ${Math.round(
          (Date.now() - this.lastDroppedFrame) / 1000
        ).toString()}s]`.red
      );
      this.lastDroppedFrame = Date.now();
    } else if (lastUpdateLatency > frameDurationMS * 1.5) {
      console.warn(`[${moment().format('HH:mm:ss')}] Dropped frame: Last one took ${lastUpdateLatency}ms (instead of ${Math.round(frameDurationMS)}ms)`.yellow);
    }
  }
};
