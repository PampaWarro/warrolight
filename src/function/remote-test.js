import {TimeTickedFunction} from "./TimeTickedFunction";
import {ColorUtils} from "../utils/ColorUtils";

export class Func extends TimeTickedFunction{
  // Override base class
  drawFrame(draw, done){
    let colors = [... Array(this.numberOfLeds)]; // Array del tamaño de las luces
    let colors2 = colors.map(() => "#000000");
    colors2[45] = "#660000"
    draw(colors2);
  }
}