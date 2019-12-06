const EventEmitter = require("events");
const moment = require("moment");
const _ = require("lodash");

// TODO: move this to some configuration file
const programNames = [
  "PROGRAM_Triangulo",
  "PROGRAM_Transition",
  "PROGRAM_Main_fuego2019",
  "aliveDots",
  "aliveDotsSpeed",
  "all-off",
  "all-white",
  "bandParticles",
  "bassWarpGrid",
  "bombs",
  "circles",
  "debugSetup",
  "debugShapes",
  "frequencyActivation",
  "lineal",
  "musicFlow",
  "musicFrequencyDot",
  "musicVolumeBars",
  "musicVolumeDot",
  "musicVolumeDotRandom",
  "radial",
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
    this.layout = {
      numberOfLeds: geometry.leds,
      geometry: geometry
    };
    this.shapeMapping = shapeMapping;

    this.leds = [];

    this.programs = _.keyBy(_.map(programNames, this.loadProgram), "name");
    this.setCurrentProgram(programNames[0]);
  }

  getProgramsSchema() {
    return _.map(this.programs, p => {
      return {
        name: p.name,
        config: p.configSchema,
        presets: p.generator.presets ? _.keys(p.generator.presets()) : []
      };
    });
  }

  getCurrentConfig() {
    return this.currentProgram ? this.currentProgram.config : {};
  }

  getCurrentPresets() {
    if (
      this.currentProgram &&
      this.programs[this.currentProgramName].generator.presets
    ) {
      return this.programs[this.currentProgramName].generator.presets();
    } else {
      return [];
    }
  }

  start() {
    if (this.currentProgram) {
      this.currentProgram.start(
        this.getConfig(this.programs[this.currentProgramName].configSchema),
        leds => this.updateLeds(leds)
      );
      this.running = true;
    }
  }

  restart() {
    this.currentProgram.stop();
    this.currentProgram.start(
      this.currentProgram.config,
      leds => this.updateLeds(leds)
    );
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

  getConfig(configSchema) {
    let config = {};

    if (!configSchema) {
      configSchema = this.programs[this.currentProgramName].configSchema;
    }

    for (let paramName in configSchema) {
      if (
        config[paramName] === undefined &&
        configSchema[paramName].default !== undefined
      ) {
        config[paramName] = configSchema[paramName].default;
      }
    }
    return config;
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
    let config = this.getConfig(program.configSchema);
    this.currentProgram = new program.generator(
      config,
      this.layout,
      this.shapeMapping
    );
    if (this.running) {
      this.start();
    }
  }

  onLights(cbk) {
    this.on("lights", cbk);
  }

  removeOnLights(cbk) {
    this.removeListener("lights", cbk);
  }

  onDeviceStatus(cbk) {
    this.multiplexer.onDeviceStatus(cbk);
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
    let lastUpdateLatency = new Date() - this.lastLightsUpdate;
    this.lastLightsUpdate = new Date();
    // TODO: where does the number 34 come from?
    if (lastUpdateLatency > 34) {
      console.warn(
        `[${moment().format(
          "HH:mm:ss"
        )}] Dropped frames: Last light update took ${lastUpdateLatency}ms  [+${Math.round(
          (new Date() - this.lastDroppedFrame) / 1000
        ).toString()}s]`.red
      );
      this.lastDroppedFrame = new Date();
    } else if (lastUpdateLatency > 25) {
      // console.warn(`[${moment().format('HH:mm:ss')}] Dropped frames: Last light update took ${lastUpdateLatency}ms`.yellow);
    }
  }
};
