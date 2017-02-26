// import {Func} from "./rainbow";
const _ = require('lodash')

export function programsByShape(mapping) {
  var inv = arr => [].concat(arr).reverse()

  const quiebre_abajo = 30;
  const quiebre_abajo_left = quiebre_abajo - 2;
  const quiebre_abajo_right = quiebre_abajo;

  const centroOffsetLeft = -1;
  const centroOffsetRight = -1;

  const quiebre_arriba = 30;

  const pataLeft = _.range(quiebre_abajo_left, 150)
  const pataRight = _.range(450+quiebre_abajo_right, 600)

  const basePataLeft =  _.range(0, quiebre_abajo_left);
  const basePataRight =  _.range(450, 450+quiebre_abajo_right);

  const trianguloBottomLeft = _.range(150, 210 + centroOffsetLeft);
  const trianguloBottomRight = _.range(300, 360 + centroOffsetRight);
  const trianguloBottomBottom = inv(basePataLeft).concat(basePataRight);
  const trianguloBottom = _.flatten([trianguloBottomBottom, trianguloBottomRight, inv(trianguloBottomLeft)])

  const trianguloTopLeft = _.range(360 + centroOffsetRight, 450-quiebre_arriba);
  const trianguloTopRight = _.range(210 + centroOffsetLeft, 300-quiebre_arriba);
  const trianguloTopTop = _.range(300-quiebre_arriba, 300).concat(inv(_.range(450-quiebre_arriba, 450)));
  const trianguloTop = _.flatten([trianguloTopLeft, inv(trianguloTopTop), inv(trianguloTopRight)])

  // Una permutación random de todas las luces. PSYCHO MIND FUCK
  const shuffle = _.shuffle(_.range(0,600))

  const mini_w = _.flatten([
    _.range(quiebre_abajo, 150),
    inv(_.range(450+quiebre_abajo, 600)),
    _.range(300, 360),
    inv(_.range(150, 210)),
  ])

  // Una permutación random de pedazos de a 20 luces
  const shuffleSegments10 = _.flatten(_.shuffle(_.map(_.range(0,60), i => _.range(i*10, (i+1)*10))))
  const shuffleSegments20 = _.flatten(_.shuffle(_.map(_.range(0,30), i => _.range(i*20, (i+1)*20))))
  const trianguloBottomShuffle = _.shuffle(trianguloBottom)

  // La W warra
  const Warro = _.flatten([inv(pataLeft), _.range(150,300), inv(_.range(300, 450)), pataRight])

  // Las V V
  const V1 = inv(pataLeft).concat(_.range(150,300-quiebre_arriba))
  const V2 = inv(_.range(300,450-quiebre_arriba)).concat(pataRight)

  // Reloj de arena
  const reloj = _.flatten([basePataLeft, _.range(150, 300), inv(_.range(300, 450)), inv(basePataRight)])

  const allOfIt = _.range(0, 600)
  // Numeros y letras
  const char_1 = _.range(150, 300)
  const char_2 = _.flatten([inv(trianguloBottomBottom), trianguloBottomLeft, trianguloTopRight, trianguloTopTop])
  const char_3 = _.flatten([trianguloBottomBottom, trianguloBottomRight, trianguloTopRight, trianguloTopTop])

  const char_a = _.flatten([trianguloBottom, trianguloTopRight, trianguloTopTop, inv(_.range(450-quiebre_arriba-10,450-quiebre_arriba))])
  const char_o = _.flatten([reloj.slice(0,90-20), reloj.slice(90+20,270-20), reloj.slice(270+20,360)]) // El reloj sin el centro
  const char_r = _.flatten([trianguloBottomLeft, trianguloTop, inv(trianguloBottomRight)])
  const char_w = Warro


  const knownMappings = {
    pataLeft, pataRight,
    trianguloBottom, trianguloTop,
    trianguloBottomBottom, trianguloTopTop,
    Warro, reloj, V1, V2,
    shuffle, shuffleSegments10, shuffleSegments20, trianguloBottomShuffle,
    char_1, char_2, char_3, char_a, char_o, char_r, char_w,
    mini_w, allOfIt
  };

  return class {
    constructor(config, leds) {
      this.instances = {};
      _.each(mapping, (Program, shapeName) => {
        const map = knownMappings[shapeName]
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


