import {TimeTickedFunction} from "./TimeTickedFunction";
import {ColorUtils} from "../utils/ColorUtils";

export class Func extends TimeTickedFunction{
  // Override base class
  drawFrame(draw, done){
    let colors = [... Array(this.numberOfLeds)]; // Array del tamaño de las luces
    draw(colors.map(() => "#000000"));
  }
}