// const warroStripes = require('../geometry/geometry-wchica')
// const warroStripes = require('../geometry/geometry-wgrande')
const warroStripes = require('../geometry/geometry-fuego18')
const Geometry = require('./geometry')
const _ = require('lodash');

// const ProgramNames = [
//   'all-off', 'remote-test', 'debugSetup', 'debugShapes', 'all-white',
//   'aliveDots', 'aliveDotsSpeed', 'heart',
//   //'rainbow2', 'white-',  'rainbow-horizontal', 'rainbow-hourglass',
//   'rainbow', 'stars', 'musicFlow', 'musicFreqs',  'radial', // 'vertical',  'blink'
//   //'mixRainbowTriangulos', 'mixMusicW', 'mixMusicPsycho',
//   'PROGRAM_Main',  'musicVolumeDot', 'musicVolumeBars', 'speeding-spear', 'water-flood', 'sound-waves' //'fire',  'PROGRAM_Intro'
// ]

const programNames = ["radial", "PROGRAM_Main", "rays", "aliveDots", "aliveDotsSpeed", "musicVolumeBars", "water-flood", "musicFlow", "rainbow", "sound-waves", "musicVolumeDot", "stars", "debugSetup", "debugShapes", "all-off", "all-white"]
const Emitter = require('events')
let lightsSampleEmitter = new Emitter()

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
      return {name: p.name, config: p.configSchema, presets: p.generator.presets ? _.keys(p.generator.presets()) : [] }
    })
  }

  getCurrentConfig() {
    return this.currentProgram ? this.currentProgram.config : {};
  }

  getCurrentPresets() {
    if(this.currentProgram && this.programs[this.currentProgramName].generator.presets){
      return this.programs[this.currentProgramName].generator.presets();
    } else {
      return [];
    }
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

  restart(){
    this.currentProgram.stop()
    this.currentProgram.start(this.currentProgram.config,(leds) => this.updateLeds(leds),() => ({}))
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

  onLights(cbk) {
    lightsSampleEmitter.on('lights', cbk)
  }

  removeOnLights(cbk) {
    lightsSampleEmitter.removeListener('lights', cbk)
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
    lightsSampleEmitter.emit('lights', leds)
    this.setLightsCbk(leds)
  }
}