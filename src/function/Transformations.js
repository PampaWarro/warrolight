import {getShapes} from './shape-mapping-wchica'
// import {getShapes} from './shape-mapping-wgrande'

const _ = require('lodash')

export function programsByShape(mapping) {
  const knownMappings = getShapes()

  return class {
    constructor(config, leds) {
      this.instances = {};
      _.each(mapping, (Program, shapeName) => {
        let map = knownMappings[shapeName]

        if(!map){
          console.warn(`Shape mapping '${shapeName}' not found. Using shape 'allOfIt'`)
          map = knownMappings.allOfIt;
        }

        let localLeds = _.extend({}, leds, {numberOfLeds: map.length})
        // Map new geometry
        localLeds.position = { x: [... Array(map.length)], y: [... Array(map.length)] }
        for (let i =  0; i < map.length; i++) {
          localLeds.position.x[i] = leds.geometry.x[map[i]]
          localLeds.position.y[i] = leds.geometry.y[map[i]]
        }
        // Support specific configs
        let specificConfig = config;
        if(_.isArray(Program)){
          [Program, specificConfig] = Program;
          specificConfig = _.extend({}, config, specificConfig)
        }
        this.instances[shapeName] = new Program(specificConfig, localLeds)
        this.instances[shapeName].specificConfig = specificConfig;
      })
      this.state = [... Array(leds.numberOfLeds)].map(()=> "#000000");
    }

    start(config, draw, done) {
      // Debounce draw para no enviar mil veces el estado cada vez que un subprograma cambia algo

      const debouncedDraw = _.debounce(draw, 5);

      _.each(this.instances, (program, mapName) => {
        const map = knownMappings[mapName]

        program.start(program.specificConfig, (colors) => {
          _.each(colors, (col, index) => this.state[map[index]] = col);
          debouncedDraw(this.state);
        }, done)
      })

      done()
    }

    updateConfig(key, value) {
      _.each(this.instances, (program, mapName) => {
        if (program.specificConfig[key] && program.specificConfig[key] !== value) {
          program.specificConfig[key] = value
          program.config[key] = value
        }
      })
    }

    stop() {
      _.each(this.instances, (program, mapName) => program.stop())
    }

    static configSchema() {
      let schema = {};
      _.each(mapping, (Program, mapName) => {
        if(_.isArray(Program)){
          [Program,] = Program
        }
        schema = _.extend(schema, Program.configSchema())
      });
      return schema;
    }
  }
}

function getMappedFunction(Program, mappingFunction) {
  return class {
    constructor(config) {
      this.instance = new Program(config);
    }

    start(config, draw, done) {
      this.instance.start(config, function (colors) {
        draw(mappingFunction(colors))
      }, done)
      done()
    }

    stop() {
      this.instance.stop()
    }

    static configSchema() {
      return Program.configSchema()
    }
  }
}


