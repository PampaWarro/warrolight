import {TimeTickedFunction} from "./TimeTickedFunction";
import {ColorUtils} from "../utils/ColorUtils";

export class Func extends TimeTickedFunction{
  // Override base class
  drawFrame(draw, done){
    // En HSV blanco es (0,0,1)
    var tonoDeBlanco = ColorUtils.rgbToHex(... ColorUtils.HSVtoRGB(0, 0, this.config.brillo));

    let colors = [... Array(this.config.numberOfLeds)]; // Array del tamaño de las luces
    draw(colors.map(() => tonoDeBlanco));
  }

  // Override and extend config Schema
  static configSchema(){
    let res = super.configSchema();
    res.brillo =  {type: Number, min: 0, max: 1, step: 0.01, default: 0.5}
    return res;
  }
}