import {TimeTickedFunction} from "./TimeTickedFunction";
import {ColorUtils} from "../utils/ColorUtils";

export class Func extends TimeTickedFunction{
  // Override base class
  drawFrame(draw, done){
    let colors = [... Array(this.numberOfLeds)]; // Array del tamaño de las luces

    draw(colors.map((v,i) => {
      return ColorUtils.HSVtoHex(Math.floor(i/50)/12, 0.8, this.config.brillo);
    }));
  }

  // Override and extend config Schema
  static configSchema(){
    let res = super.configSchema();
    res.brillo =  {type: Number, min: 0, max: 1, step: 0.01, default: 0.5}
    return res;
  }
}