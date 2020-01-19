import fs from "fs";
import glob from "glob";
import path from "path";
import { PNG } from "pngjs";
import { rgbToHex } from "./ColorUtils";

type Color = [number, number, number, number];

function interpolate(a: Color, b: Color, blend: number) {
  if (blend < 0 || blend > 1) {
    throw `blend out of bounds: ${blend}`;
  }
  // TODO: implement interpolation.
  return blend < 0.5 ? a : b;
}

abstract class Gradient {
  abstract colorAt(pos: number): Color;
  abstract reverse(): Gradient;
  abstract cssLinearGradientStops(): string;
}

class EvenSpacedGradient extends Gradient {
  colors: Color[];
  constructor(colors: Color[]) {
    super();
    if (colors.length == 0) {
      throw "Need at least one color";
    }
    this.colors = colors;
  }
  colorAt(pos: number): Color {
    if (pos < 0 || pos > 1) {
      throw `pos out of bounds: ${pos}`;
    }
    const scaledPos = pos * (this.colors.length - 1);
    const lowerIndex = Math.floor(scaledPos);
    const upperIndex = Math.ceil(scaledPos);
    const blend = scaledPos - lowerIndex;
    return interpolate(this.colors[lowerIndex], this.colors[upperIndex], blend);
  }
  reverse() {
    return new EvenSpacedGradient(Array.from(this.colors).reverse());
  }
  cssLinearGradientStops() {
    return this.colors
      .map(color => rgbToHex(color[0], color[1], color[2]))
      .join(", ");
  }
}

const gradientsByName: { [index: string]: Gradient } = {};

function gradientFromPng(filename: string) {
  var data = fs.readFileSync(filename);
  var png = PNG.sync.read(data);
  if (Math.min(png.width, png.height) != 1) {
    throw `Width or height must be 1, found: ${png.width}, ${png.height}.`;
  }
  const size = Math.max(png.width, png.height);
  const colors: Color[] = new Array(size);
  for (let i = 0; i < size; i++) {
    const offset = 4 * i;
    colors[i] = [
      png.data[offset],
      png.data[offset + 1],
      png.data[offset + 2],
      png.data[offset + 3]
    ];
  }
  return new EvenSpacedGradient(colors);
}

const gradientFiles = glob.sync(path.join(__dirname, "gradientlib", "*"));
gradientFiles.forEach(filename => {
  const extension = path.extname(filename);
  const name = path.basename(filename, extension);
  if (extension.toLowerCase() == ".png") {
    const gradient = gradientFromPng(filename);
    gradientsByName[name] = gradient;
    gradientsByName[`${name}_r`] = gradient.reverse();
  }
});

module.exports = gradientsByName;
