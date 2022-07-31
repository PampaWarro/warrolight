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
  return mix(a, b, _.clamp(blend, 0, 1));
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
    pos = _.clamp(pos, 0, 1);
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

class TimedMultiGradient extends Gradient {
  gradients: Gradient[];
  gradientTime: number;
  transitionTime: number;
  _currentTime: number = null;
  _currentGradient: Gradient = null;
  _currentGradientSetTime: number = null;
  _nextGradient: Gradient = null;

  constructor(gradients: Gradient[], gradientTime: number = 20, transitionTime: number = 5) {
    super();
    if (gradients.length < 2) {
      throw "Need at least 2 gradients";
    }
    this.gradients = gradients;
    this.gradientTime = gradientTime;
    this.transitionTime = transitionTime;
  }

  reverse(): Gradient {
    throw "unimplemented";
  }

  cssLinearGradientStops(): string {
    throw "unimplemented";
  }

  set currentTime(currentTime: number) {
    this._currentTime = currentTime;
  }

  get currentTime() {
    if (this._currentTime == null) {
      throw "need to set currentTime first";
    }
    return this._currentTime;
  }

  get currentGradient() {
    if (this._currentGradient == null ||
        this.currentTime > this._currentGradientSetTime + this.gradientTime +
                               this.transitionTime) {
      if (this._nextGradient == null) {
        this._currentGradient = _.sample(this.gradients);
      } else {
        this._currentGradient = this._nextGradient;
        this._nextGradient = null;
      }
      this._currentGradientSetTime = this.currentTime;
    }
    return this._currentGradient;
  }

  get nextGradient() {
    while (this._nextGradient == null ||
           this._nextGradient == this.currentGradient) {
      this._nextGradient = _.sample(this.gradients);
    }
    return this._nextGradient;
  }

  colorAt(pos: number) {
    const dt = this.currentTime - this._currentGradientSetTime;
    if (dt <= this.gradientTime) {
      return this.currentGradient.colorAt(pos);
    }
    if (dt >= this.gradientTime + this.transitionTime) {
      return this.nextGradient.colorAt(pos);
    }
    const blend = (dt - this.gradientTime) / this.transitionTime;
    return interpolate(this.currentGradient.colorAt(pos),
      this.nextGradient.colorAt(pos), blend);
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

const blackToWhiteGradient =
    new EvenSpacedGradient([ [ 0, 0, 0, 1 ], [ 255, 255, 255, 1 ] ]);
const gradientsByName: {[index: string]: Gradient} = {
  _bw : blackToWhiteGradient,
  _wb : blackToWhiteGradient.reverse(),
};
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
  getGradientsByNameCss: () => _.mapValues(gradientsByName, (g: Gradient) => g.cssLinearGradientStops()),
  allGradients: () => _.values(gradientsByName),
  TimedMultiGradient,
};
