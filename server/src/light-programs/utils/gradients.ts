import fs from "fs";
import glob from "glob";
import path from "path";
import { PNG } from "pngjs";
import _ from "lodash"
import { Color } from "../../types";
import { mix, hexToRgb, rgbToHex } from "./ColorUtils"
import xpath from "xpath";
import { DOMParser } from "xmldom";
import colorString from "color-string";

function interpolate(a: Color, b: Color, blend: number) {
  if (blend < 0 || blend > 1) {
    throw `blend out of bounds: ${blend}`;
  }

  return mix(a, b, blend);
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
    if (pos == null || Number.isNaN(pos)) {
      throw `invalid pos: ${pos}`;
    }
    if (pos < 0 || pos > 1) {
      throw `pos out of bounds: ${pos}`;
    }
    const scaledPos = pos * (this.colors.length - 1);
    const lowerIndex = Math.floor(scaledPos);
    const upperIndex = Math.ceil(scaledPos);
    if (lowerIndex == upperIndex) {
      return this.colors[lowerIndex];
    }
    const lowerColor = this.colors[lowerIndex];
    const upperColor = this.colors[upperIndex];
    const blend = scaledPos - lowerIndex;
    return interpolate(lowerColor, upperColor, blend);
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

function gradientFromPng(filename: string) {
  const data = fs.readFileSync(filename);
  const png = PNG.sync.read(data);
  if (Math.min(png.width, png.height) != 1) {
    throw `Width or height must be 1, found: ${png.width}, ${png.height}.`;
  }
  PNG.adjustGamma(png);
  const size = Math.max(png.width, png.height);
  const colors: Color[] = new Array(size);
  for (let i = 0; i < size; i++) {
    const offset = 4 * i;
    colors[i] = [
      png.data[offset],
      png.data[offset + 1],
      png.data[offset + 2],
      png.data[offset + 3] / 255
    ];
  }

  return new EvenSpacedGradient(colors);
}

const svgXPath = xpath.useNamespaces({ svg: "http://www.w3.org/2000/svg" });
function gradientFromSvg(filename: string) {
  const data = fs.readFileSync(filename, { encoding: "utf8" });
  const doc = new DOMParser().parseFromString(data);
  const gradient = svgXPath("//svg:linearGradient", doc)[0] as XMLDocument;
  const stops = svgXPath("./svg:stop", gradient);
  const colors: Color[] = new Array(stops.length);
  stops.forEach((stop: Element, i) => {
    const color: Color = colorString.get.rgb(stop.getAttribute("stop-color"));
    // TODO: add support for uneven spaced gradients and stop "offset" attr.
    colors[i] = color;
  });
  return new EvenSpacedGradient(colors);
}

function loadGradient(gradientNameOrCssStops: string) {
  if(!gradientNameOrCssStops)
    return null;

  if(!gradientsByName[gradientNameOrCssStops]) {
    //TODO: Replace for more robust conversion, or serialize gradients in a different way
    try {
      const cssColorStrings = gradientNameOrCssStops.split(/,\s*/);
      // Cache so that subsequent calls use the same gradient object
      gradientsByName[gradientNameOrCssStops] = new EvenSpacedGradient(cssColorStrings.map(s => hexToRgb(s)));
    } catch(err) {
      console.error(`Invalid gradient string: ${gradientNameOrCssStops}`)
      return null;
    }
  }

  return gradientsByName[gradientNameOrCssStops]
}


const gradientsByName: { [index: string]: Gradient } = {};
const gradientFiles = glob.sync(path.join(__dirname, "gradientlib", "*"));
gradientFiles.forEach(filename => {
  const extension = path.extname(filename).toLowerCase();
  const name = path.basename(filename, extension);
  if (extension == ".png") {
    const gradient = gradientFromPng(filename);
    gradientsByName[name] = gradient;
    gradientsByName[`${name}_r`] = gradient.reverse();
  } else if (extension == ".svg") {
    const gradient = gradientFromSvg(filename);
    gradientsByName[name] = gradient;
    gradientsByName[`${name}_r`] = gradient.reverse();
  } else {
    console.warn(
      `Unknown file extension ${extension}: ${path.basename(filename)}`
    );
  }
});

module.exports = {
  loadGradient,
  getGradientsByName: () => gradientsByName,
  getGradientsByNameCss: () => _.mapValues(gradientsByName, (g: Gradient) => g.cssLinearGradientStops())
};
