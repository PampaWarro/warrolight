const _ = require("lodash");
const EventEmitter = require("events");
const fs = require("fs");
const moment = require("moment");

const ProgramScheduler = require("./ProgramScheduler");

const savedPresetsFilePath =  `${__dirname}/../setups/program-presets/default.json`;

if (!fs.existsSync(savedPresetsFilePath)) {
  fs.writeFileSync(savedPresetsFilePath, "{}");
}

const savedPresets = require(savedPresetsFilePath)

// TODO: move this to some configuration file
const programNames = [
  "mix",
  "congaShooting2",
  "congaScore",
  "congaShooting",
  "congaRope",
  "PROGRAM_Main_fuego2019",
  "PROGRAM_Triangulo",
  "PROGRAM_Transition",
  "aliveDots",
  "aliveDotsSpeed",
  "all-off",
  "all-white",
  "bandParticles",
  "bassWarpGrid",
  "bombs",
  "ca",
  "circles",
  "debugSetup",
  "debugShapes",
  "frequencyActivation",
  "gradientSphere",
  "lineal",
  "musicFlow",
  "musicFlash",
  "musicFrequencyDot",
  "musicVolumeBars",
  "musicVolumeDot",
  "musicVolumeDotRandom",
  "noise",
  "radial",
  "radial3d",
  "radialSun",
  "radialWarp",
  "rainbow",
  "rays",
  "shapes",
  "sound-waves",
  "stars",
  "stripe-patterns",
  "warroBass",
  "water-flood"
];

module.exports = class LightController extends EventEmitter {
  constructor(multiplexer, geometry, shapeMapping) {
    super();
    this.multiplexer = multiplexer;
    this.geometry = geometry;
    this.shapeMapping = shapeMapping;

    this.leds = [];

    this.programs = _.keyBy(_.map(programNames, this.loadProgram), "name");
    this.setCurrentProgram(programNames[0]);

    this.multiplexer.onDeviceStatus((... args) => this.emit('deviceStatus', ... args));

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
    if (this.currentProgram) {
      return this.currentConfig
    } else {
      return {}
    }
  }

  getProgramPresets(programName) {
    const program = this.programs[programName];
    if(program) {
      let presets = savedPresets[programName] || {};

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
    if (this.currentProgram) {
      return this.getProgramPresets(this.currentProgramName);
    } else {
      return {};
    }
  }

  start() {
    if (this.currentProgram) {
      this.currentConfig = this.buildParameters(this.programs[this.currentProgramName].configSchema);
      this.currentProgram.start(
        this.getConfig(this.currentConfig),
        leds => this.updateLeds(leds)
      );
      this.running = true;
    }
  }

  restart() {
    this.currentProgram.restart();
  }

  stop() {
    this.running = false;
    if (this.currentProgram) {
      this.currentProgram.stop();
    }
  }

  setLights(colorArray) {
    this.multiplexer.setLights(colorArray);
  }

  getConfig({defaults, presetOverrides, overrides, currentPreset}) {
    return {... defaults, ... presetOverrides, ... overrides};
  }

  buildParameters(configSchema, presetOverrides = {}, presetName = null, overrides = {}) {
    let defaults = {};

    for (let paramName in configSchema) {
      if (defaults[paramName] === undefined && configSchema[paramName].default !== undefined) {
        defaults[paramName] = configSchema[paramName].default;
      }
    }
    return {defaults, presetOverrides, currentPreset: presetName, overrides};
  }

  updateConfigOverride(config) {
    let configSchema = this.programs[this.currentProgramName].configSchema;
    let { presetOverrides, currentPreset, overrides } = this.currentConfig;
    this.currentConfig = this.buildParameters(configSchema, presetOverrides, currentPreset, {... overrides, ... config})
    this.currentProgram.updateConfig(this.getConfig(this.currentConfig));
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
    this.currentProgram.updateConfig(this.getConfig(this.currentConfig));
  }

  savePreset(programName, presetName, config) {
    savedPresets[programName] = savedPresets[programName] || {}
    savedPresets[programName][presetName] = config;

    fs.writeFile(savedPresetsFilePath, JSON.stringify(savedPresets, true, 4), (err) => {
      if(err) {
        console.error(err);
      } else {
        console.log(`Updated presets file ${savedPresetsFilePath}`)
      }
    });
  }

  instanciateProgram(name, extraConfig) {
    let program = this.programs[name];
    let config = this.getConfig(this.buildParameters(program.configSchema, {}, null, extraConfig));
    return  new program.generator(
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

    if (this.running && this.currentProgram) {
      this.currentProgram.stop();
    }
    this.currentProgramName = name;
    let program = this.programs[name];

    this.currentConfig = this.buildParameters(program.configSchema)
    let config = this.getConfig(this.currentConfig);

    this.currentProgram = new ProgramScheduler(
      new program.generator(
        config,
        this.geometry,
        this.shapeMapping,
        this
      )
    );
    if (this.running) {
      this.start();
    }
  }

  loadProgram(name) {
    const FunctionClass = require("./light-programs/programs/" + name);
    return {
      name: name,
      configSchema: FunctionClass.configSchema(),
      generator: FunctionClass
    };
  }

  updateLeds(rgbaLeds) {
    // TODO: remove rgba before?
    const rgbLeds = _.map(rgbaLeds, rgba => rgba.slice(0, 3));
    this.emit("lights", rgbLeds);

    this.setLights(rgbLeds);
    let lastUpdateLatency = Date.now() - this.lastLightsUpdate;
    this.lastLightsUpdate = Date.now();
    // TODO: where does the number 34 come from?
    if (lastUpdateLatency > 34) {
      console.warn(
        `[${moment().format(
          "HH:mm:ss"
        )}] Dropped frames: Last light update took ${lastUpdateLatency}ms  [+${Math.round(
          (Date.now() - this.lastDroppedFrame) / 1000
        ).toString()}s]`.red
      );
      this.lastDroppedFrame = Date.now();
    } else if (lastUpdateLatency > 25) {
      // console.warn(`[${moment().format('HH:mm:ss')}] Dropped frames: Last light update took ${lastUpdateLatency}ms`.yellow);
    }
  }
};
