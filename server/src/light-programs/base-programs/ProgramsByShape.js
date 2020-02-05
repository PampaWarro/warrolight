const _ = require("lodash");
const util = require("util");
const LightProgram = require("./LightProgram");

module.exports = function programsByShape(mapping) {
  return class ProgramsByShape extends LightProgram {
    constructor(config, geometry, shapeMapping) {
      super(config, geometry)
      this.instances = {};
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
          height: geometry.height,
          width: geometry.width,
          leds: map.length
        };

        for (let i = 0; i < map.length; i++) {
          shape.x[i] = geometry.x[map[i]];
          shape.y[i] = geometry.y[map[i]];
          shape.z[i] = geometry.z[map[i]];
        }

        // Support specific configs
        let specificConfig = config;
        if (_.isArray(Program)) {
          [Program, specificConfig] = Program;
          let defaultConfig = this.extractDefault(
            Program.configSchema ? Program.configSchema() : {}
          );
          specificConfig = _.extend({}, config, defaultConfig, specificConfig);
        }
        this.instances[shapeName] = new Program(specificConfig, shape);
        this.instances[shapeName].specificConfig = specificConfig;
      });
      this.state = new Array(this.numberOfLeds).fill([0, 0, 0]);
    }

    init() {
      for (let shapeName in this.instances) {
        this.instances[shapeName].init();
      }
    }

    extractDefault(configSchema) {
      let config = {};
      for (let paramName in configSchema) {
        if (configSchema[paramName].default !== undefined) {
          config[paramName] = configSchema[paramName].default;
        }
      }
      return config;
    }

    drawFrame(draw, audio) {
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

        program.drawFrame(
          colors => {
            _.each(colors, (col, index) => (this.state[map[index]] = col));
          },
          audio
        );
      });

      draw(this.state);
    }

    updateConfig(config) {
      this.config = config;
      for (let shapeName in this.instances) {
        this.instances[shapeName].updateConfig(config);
      }
    }

    toString() {
      return `${super.toString()}(${util.inspect(this.instances)})`;
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
