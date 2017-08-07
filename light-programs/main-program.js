const warroStripes = require('./geometry-wchica')
const Geometry = require('./geometry')
const _ = require('lodash');

// const ProgramNames = [
//   'all-off', 'remote-test', 'debugSetup', 'debugShapes', 'all-white',
//   'aliveDots', 'aliveDotsSpeed', 'heart',
//   //'rainbow2', 'white-spear',  'rainbow-horizontal', 'rainbow-hourglass',
//   'rainbow', 'stars', 'musicFlow', 'musicFreqs',  'radial', // 'vertical',  'blink'
//   //'mixRainbowTriangulos', 'mixMusicW', 'mixMusicPsycho',
//   'PROGRAM_Main',  'musicVolumeDot', 'musicVolumeBars', 'speeding-spear', 'water-flood', 'sound-waves' //'fire',  'PROGRAM_Intro'
// ]

const programNames = ["musicFlow", "rainbow", "sound-waves", "musicVolumeDot", "radial", "stars", "debugShapes", "all-off", "all-white"]


module.exports = class LightController {
  constructor(setLightsCbk) {
    this.setLightsCbk = setLightsCbk

    const geometry = new Geometry(warroStripes)

    this.defaultConfig = {
      frequencyInHertz: 60
    }

    this.layout = {
      numberOfLeds: geometry.leds,
      geometry: geometry
    }

    this.leds = []

    this.getLeds = (index) => this.leds[index]

    this.programs = _.keyBy(_.map(programNames, this.loadProgram), 'name')
    this.setCurrentProgram(programNames[0])
  }

  getProgramsSchema() {
    return _.map(this.programs, p => {
      return {name: p.name, config: p.configSchema}
    })
  }

  getCurrentConfig() {
    return this.currentProgram ? this.currentProgram.config : {};
  }

  start() {
    if (this.currentProgram) {
      this.currentProgram.start(
        this.getConfig(this.programs[this.currentProgramName].configSchema),
        (leds) => this.updateLeds(leds),
        () => ({})
      )
      this.running = true;
    }
  }

  stop() {
    this.running = false;
    if (this.currentProgram) {
      this.currentProgram.stop();
    }
  }

  getConfig(configSchema = {}) {
    let config = _.clone(this.defaultConfig);
    for (let paramName in configSchema) {
      if (config[paramName] === undefined && configSchema[paramName].default !== undefined) {
        config[paramName] = configSchema[paramName].default;
      }
    }
    return config
  }

  setCurrentProgram(name) {
    let selectedProgram = this.programs[name];
    if (selectedProgram) {
      if (this.running && this.currentProgram) {
        this.currentProgram.stop();
      }
      this.currentProgramName = name
      let program = this.programs[name];
      let config = this.getConfig(program.configSchema);
      this.currentProgram = new (program.generator)(config, this.layout)
      if (this.running) {
        this.start();
      }
    }
  }

  loadProgram(name) {
    const FunctionClass = require('./programs/' + name);
    return {
      name: name,
      configSchema: FunctionClass.configSchema(),
      generator: FunctionClass
    }
  }

  updateLeds(leds) {
    this.setLightsCbk(leds)
  }
}