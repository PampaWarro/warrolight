const fs = require("fs");
const path = require("path");
const {PNG} = require("pngjs");
const LightProgram = require("./../base-programs/LightProgram");

// Las imágenes se cargan de esta carpeta: cualquier .png que se agregue aparece
// en el dropdown. Conviene que tengan más o menos tantas filas como luces tiene
// la tira donde se muestran (las patas de la W tienen 120).
const IMAGES_DIR = path.join(__dirname, "..", "povImages");
const imageNames = fs.existsSync(IMAGES_DIR)
  ? fs.readdirSync(IMAGES_DIR).filter(f => f.toLowerCase().endsWith(".png")).map(f => path.basename(f, path.extname(f)))
  : [];
const images = {};
function loadImage(name) {
  if (!images[name]) {
    const file = path.join(IMAGES_DIR, `${name}.png`);
    images[name] = fs.existsSync(file) ? PNG.sync.read(fs.readFileSync(file)) : null;
  }
  return images[name];
}

// Persistencia de visión (POV). Cada cuadro muestra una sola columna de la imagen
// en las tiras elegidas (por defecto las patas de afuera de la W), con las filas
// a lo alto de la tira. Las tiras no se mueven, así que la imagen aparece cuando
// el que mira mueve los ojos rápido de costado o cuando se la saca con una cámara
// paneando o con exposición larga. Cuantos más cuadros por segundo, más ancha y
// más nítida se ve.
module.exports = class PovImage extends LightProgram {
  init() {
    const g = this.geometry;
    const shapes = this.shapeMapping ? this.shapeMapping() : {};
    this.leds = shapes[this.config.shape] || [...Array(this.numberOfLeds).keys()];
    let top = Infinity, bottom = -Infinity;
    for (const i of this.leds) {
      top = Math.min(top, g.y[i]);
      bottom = Math.max(bottom, g.y[i]);
    }
    // 0 arriba, 1 abajo.
    this.row = this.leds.map(i => (g.y[i] - top) / Math.max(bottom - top, 1));
    this.column = 0;
    this.direction = 1;
  }

  drawFrame(leds, context) {
    leds.fill([0, 0, 0]);
    const image = loadImage(this.config.image);
    if (!image) return;

    const {width, height, data} = image;
    const gap = this.config.gap;
    const column = Math.floor(this.column);
    if (column < width) {
      const x = this.direction > 0 || !this.config.pingPong ? column : width - 1 - column;
      const brightness = this.config.brightness;
      for (let k = 0; k < this.leds.length; k++) {
        const y = Math.min(height - 1, Math.round(this.row[k] * (height - 1)));
        const p = (y * width + x) * 4;
        const alpha = data[p + 3] / 255;
        const v = brightness * alpha;
        leds[this.leds[k]] = [data[p] * v, data[p + 1] * v, data[p + 2] * v];
      }
    }

    this.column += this.config.columnsPerFrame;
    if (this.column >= width + gap) {
      this.column = 0;
      if (this.config.pingPong) this.direction = -this.direction;
    }
  }

  updateConfig(config) {
    const reshape = config.shape !== this.config.shape;
    this.config = config;
    if (reshape) this.init();
  }

  static presets() {
    return {
      default: {},
      idaYVuelta: {pingPong: true, gap: 0},
      lento: {columnsPerFrame: 0.25, fps: 60},
      todaLaW: {shape: "WarroOnly"},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    // POV quiere la mayor cantidad de cuadros por segundo posible.
    res.fps = {...res.fps, default: 120};
    res.image = {type: String, values: imageNames, default: imageNames.includes("smiley") ? "smiley" : imageNames[0]};
    res.shape = {type: String, values: ["totemsExtExt", "pataLeft", "pataRight", "WarroOnly", "arcos", "allOfIt"], default: "totemsExtExt"};
    res.columnsPerFrame = {type: Number, min: 0.1, max: 4, step: 0.05, default: 1};
    // Columnas apagadas entre una pasada y la siguiente.
    res.gap = {type: Number, min: 0, max: 200, step: 1, default: 20};
    // Ida y vuelta: la imagen se muestra al derecho y después al revés.
    res.pingPong = {type: Boolean, default: false};
    res.brightness = {type: Number, min: 0, max: 1, step: 0.01, default: 1};
    return res;
  }
};
