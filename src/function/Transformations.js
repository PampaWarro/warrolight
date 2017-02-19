// import {Func} from "./rainbow";
const _ = require('lodash')

export function programsByShape(mapping) {
  var inv = arr => [].concat(arr).reverse()

  const quiebre_abajo = 30;
  const quiebre_arriba = 30;

  const pataLeft = _.range(quiebre_abajo, 150)
  const pataRight = _.range(450+quiebre_abajo, 600)

  const basePataLeft =  _.range(0, quiebre_abajo);
  const basePataRight =  _.range(450, 450+quiebre_abajo);

  const trianguloBottomLeft = _.range(150, 210);
  const trianguloBottomRight = _.range(300, 360);
  const trianguloBottomBottom = inv(basePataLeft).concat(basePataRight);
  const trianguloBottom = _.flatten([trianguloBottomBottom, trianguloBottomRight, inv(trianguloBottomLeft)])

  const trianguloTopLeft = _.range(360, 450-quiebre_arriba);
  const trianguloTopRight = _.range(210, 300-quiebre_arriba);
  const trianguloTopTop = _.range(300-quiebre_arriba, 300).concat(inv(_.range(450-quiebre_arriba, 450)));
  const trianguloTop = _.flatten([trianguloTopLeft, inv(trianguloTopTop), inv(trianguloTopRight)])

  // Una permutación random de todas las luces. PSYCHO MIND FUCK
  const shuffle = _.shuffle(_.range(0,600))

  // Una permutación random de pedazos de a 20 luces
  const shuffleSegments10 = _.flatten(_.shuffle(_.map(_.range(0,60), i => _.range(i*10, (i+1)*10))))
  const shuffleSegments20 = _.flatten(_.shuffle(_.map(_.range(0,30), i => _.range(i*20, (i+1)*20))))

  // Numeros
  const char_1 = _.range(150, 300)
  const char_2 = _.flatten([inv(trianguloBottomBottom), trianguloBottomLeft, trianguloTopRight, trianguloTopTop])
  const char_3 = _.flatten([trianguloBottomBottom, trianguloBottomRight, trianguloTopRight, trianguloTopTop])

  // La W warra
  const Warro = _.flatten([inv(pataLeft), _.range(150,300), inv(_.range(300, 450)), pataRight])

  // Las V V
  const V1 = inv(pataLeft).concat(_.range(150,300-quiebre_arriba))
  const V2 = inv(_.range(300,450-quiebre_arriba)).concat(pataRight)
  // Reloj de arena
  const reloj = _.flatten([basePataLeft, _.range(150, 300), inv(_.range(300, 450)), inv(basePataRight)])

  const knownMappings = {
    pataLeft, pataRight,
    trianguloBottom, trianguloTop,
    trianguloBottomBottom, trianguloTopTop,
    Warro, reloj, V1, V2,
    shuffle, shuffleSegments10, shuffleSegments20,
    char_1, char_2, char_3
  };

  return class {
    constructor(config, leds) {
      this.instances = {};
      _.each(mapping, (Program, shapeName) => {
        const map = knownMappings[shapeName]
        let localLeds = _.extend({}, leds, {numberOfLeds: map.length})
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


