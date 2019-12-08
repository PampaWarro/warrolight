const _ = require("lodash");
const LightProgram = require("./LightProgram");

module.exports = function programsByShape(mapping) {
  return class ProgramsByShape extends LightProgram {
    constructor(config, leds, shapeMapping) {
      super(config, leds)
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

        let localLeds = _.extend({}, leds, { numberOfLeds: map.length });
        // Map new geometry
        localLeds.position = {
          x: [...Array(map.length)],
          y: [...Array(map.length)],
          height: leds.geometry.height,
          width: leds.geometry.width
        };
        for (let i = 0; i < map.length; i++) {
          localLeds.position.x[i] = leds.geometry.x[map[i]];
          localLeds.position.y[i] = leds.geometry.y[map[i]];
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
        this.instances[shapeName] = new Program(specificConfig, localLeds);
        this.instances[shapeName].specificConfig = specificConfig;
      });
      this.state = new Array(leds.numberOfLeds).fill([0, 0, 0]);
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
          console.warn(
            `NO MAPPING FOUND WITH KEY ${mapName}. Defaulting to all`
          );
          return this.knownMappings["all"];
        }

        // TODO: remove this forwarding somehow
        program.timeInMs = this.timeInMs;
        program.frameNumber = this.frameNumber;

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
