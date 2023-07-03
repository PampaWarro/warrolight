const _ = require("lodash");
const util = require("util");
const LightProgram = require("./LightProgram");

module.exports = function programsByShape(mapping, name) {
  return class ProgramsByShape extends LightProgram {
    constructor(config, geometry, shapeMapping, lightController) {
      super(config, geometry)
      this.instances = {};
      this.perInstanceLeds = {};
      this.knownMappings = shapeMapping();

      _.each(mapping, (Program, shapeName) => {
        let map = this.knownMappings[shapeName];

        if (!map) {
          console.warn(
            `Shape mapping '${shapeName}' not found. Using shape 'allOfIt'`
          );
          map = this.knownMappings.allOfIt;
        }

        // Map new geometry
        // TODO: we are creating a Geometry-like object, unify with the original Geometry
        const shape = {
          x: [...Array(map.length)],
          y: [...Array(map.length)],
          z: [...Array(map.length)],
          density: [...Array(map.length)],
          height: geometry.height,
          width: geometry.width,
          depth: geometry.depth,
          leds: map.length,
          definition: geometry.definition,
        };

        for (let i = 0; i < map.length; i++) {
          shape.x[i] = geometry.x[map[i]];
          shape.y[i] = geometry.y[map[i]];
          shape.z[i] = geometry.z[map[i]];
          shape.density[i] = geometry.density[map[i]];
        }

        // Support specific configs
        let specificConfig = {... config};
        if (_.isArray(Program)) {
          [Program, specificConfig] = Program;
          let defaultConfig = Program.extractDefaults();
          specificConfig = _.extend({}, config, defaultConfig, specificConfig);
        }
        this.instances[shapeName] = new Program(specificConfig, shape, shapeMapping, lightController);
        this.instances[shapeName].specificConfig = specificConfig;
        this.perInstanceLeds[shapeName] = new Array(map.length).fill([0, 0, 0]);
      });
    }

    init() {
      for (let shapeName in this.instances) {
        this.instances[shapeName].init();
      }
    }

    drawFrame(leds, context) {
      _.each(this.instances, (program, mapName) => {
        const map = this.knownMappings[mapName];

        if (!map) {
          // console.warn(
          //   `No mapping found with key ${mapName}. Defaulting to 'allOfIt'`
          // );
          return this.knownMappings["allOfIt"];
        }

        // TODO: remove this forwarding somehow
        program.timeInMs = this.timeInMs;

        const perInstanceLeds = this.perInstanceLeds[mapName];
        program.drawFrame(perInstanceLeds, context);
        _.each(perInstanceLeds, (col, index) => (leds[map[index]] = col));
      });
    }

    updateConfig(config) {
      this.config = config;
      for (let shapeName in this.instances) {
        const instance = this.instances[shapeName];
        instance.updateConfig({ ...instance.specificConfig, ...config });
      }
    }

    toString() {
      return _.map(this.instances, (p,shape) => `${name ? name.yellow+' ' : ''}[${shape.cyan}] ${p.toString().green} ${JSON.stringify(p.specificConfig).gray}`).join('\n');
    }

    static configSchema() {
      let schema = {};
      _.each(mapping, (Program, mapName) => {
        if (_.isArray(Program)) {
          [Program] = Program;
        }
        schema = _.extend(schema, Program.configSchema());
      });
      return schema;
    }
  };
};
