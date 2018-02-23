import {TimeTickedFunction} from "./TimeTickedFunction";
import {ColorUtils} from "../utils/ColorUtils";

export class Func extends TimeTickedFunction{
  // Override base class
  drawFrame(draw, done){
    let colors = [... Array(this.numberOfLeds)]; // Array del tamaño de las luces
    let colors2 = colors.map(() => [0,0,0]);
    colors2[45] = [102,0,0]
    draw(colors2);
  }
}