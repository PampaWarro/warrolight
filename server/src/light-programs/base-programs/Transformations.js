const _ = require("lodash");

module.exports = function programsByShape(mapping) {
  return class {
    constructor(config, leds, geometryMapping) {
      this.instances = {};
      this.config = config;

      this.knownMappings = geometryMapping();

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
      this.state = [...Array(leds.numberOfLeds)].map(() => [0, 0, 0]);
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

    start(config, draw, done) {
      // Debounce draw para no enviar mil veces el estado cada vez que un subprograma cambia algo

      const debouncedDraw = _.debounce(draw, 5);

      _.each(this.instances, (program, mapName) => {
        const map = this.knownMappings[mapName];

        if (!map) {
          console.warn(
            `NO MAPPING FOUND WITH KEY ${mapName}. Defaulting to all`
          );
          return this.knownMappings["all"];
        }

        program.start(
          program.specificConfig,
          colors => {
            _.each(colors, (col, index) => (this.state[map[index]] = col));
            debouncedDraw(this.state);
          },
          done
        );
      });

      done();
    }

    updateConfig(key, value) {
      _.each(this.instances, (program, mapName) => {
        if (
          program.specificConfig[key] &&
          program.specificConfig[key] !== value
        ) {
          program.specificConfig[key] = value;
          program.config[key] = value;
        }
      });
    }

    stop() {
      _.each(this.instances, (program, mapName) => program.stop());
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
