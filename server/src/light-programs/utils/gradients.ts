import fs from 'fs';
import glob from 'glob';
import path from 'path';
import {PNG} from 'pngjs';
import tinycolor from 'tinycolor2';
import tinygradient from 'tinygradient';

const gradientsByName: {[index: string]: tinygradient.Instance} = {};

function gradientFromPng(filename: string) {
  var data = fs.readFileSync(filename);
  var png = PNG.sync.read(data);
  if (Math.min(png.width, png.height) != 1) {
    throw `Width or height must be 1, found: ${png.width}, ${png.height}.`;
  }
  const size = Math.max(png.width, png.height);
  const colors = new Array(size);
  for (let i = 0; i < size; i++) {
    const offset = 4 * i;
    colors[i] = tinycolor({
      r: png.data[offset],
      g: png.data[offset + 1],
      b: png.data[offset + 2],
      a: png.data[offset + 3],
    });
  }
  return tinygradient(colors);
}

const gradientFiles = glob.sync(path.join(__dirname, 'gradientlib', '*'));
gradientFiles.forEach(filename => {
  const extension = path.extname(filename);
  const name = path.basename(filename, extension);
  let gradient: tinygradient.Instance = null;
  if (extension.toLowerCase() == '.png') {
    gradient = gradientFromPng(filename);
  }
  if (gradient != null) {
    gradientsByName[name] = gradient;
  }
});

module.exports = gradientsByName;
