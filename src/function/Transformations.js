// import {Func} from "./rainbow";
const _ = require('lodash')

export function programsByShape(mapping) {
  var inv = arr => [].concat(arr).reverse()

  const pataLeft = _.range(30, 150)
  const pataRight = _.range(480, 600)

  const basePataLeft =  _.range(0, 30);
  const basePataRight =  _.range(450, 480);

  const trianguloBottomLeft = _.range(150, 210);
  const trianguloBottomRight = _.range(300, 360);
  const trianguloBottomBottom = inv(basePataLeft).concat(basePataRight);
  const trianguloBottom = trianguloBottomBottom.concat(trianguloBottomRight).concat(inv(trianguloBottomLeft));

  const trianguloTopLeft = _.range(360, 420);
  const trianguloTopRight = _.range(210, 270);
  const trianguloTopTop = _.range(270, 300).concat(inv(_.range(420, 450)));
  const trianguloTop = trianguloTopLeft.concat(inv(trianguloTopTop)).concat(inv(trianguloTopRight));


  const w = [].concat(pataLeft).reverse().concat(trianguloBottomLeft).concat(trianguloTopRight)

  const reloj = basePataLeft.concat(_.range(150, 300)).concat(inv(_.range(300, 450))).concat(inv(basePataRight))

  const knownMappings = {pataLeft, pataRight, reloj, trianguloBottom, trianguloTop};

  return class {
    constructor(config, leds) {
      this.instances = {};
      _.each(mapping, (Program, mapName) => {
        const map = knownMappings[mapName]
        let localLeds = _.extend({}, leds, {numberOfLeds: map.length})
        this.instances[mapName] = new Program(config, localLeds)
      })
      this.state = [... Array(leds.numberOfLeds)].map(()=> "#000000");
    }

    start(config, draw, done) {
      // Debounce draw para no enviar mil veces el estado cada vez que un subprograma cambia algo

      const debouncedDraw = _.debounce(draw, 5);

      _.each(this.instances, (program, mapName) => {
        const map = knownMappings[mapName]

        program.start(config, (colors) => {
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


