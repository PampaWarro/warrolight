const ColorUtils = require("./../utils/ColorUtils");

class Game {
  constructor() {
    this.score = [0,0];
    this.player1Color = ColorUtils.HSVtoRGB(400, 1, 1);
    this.player2Color = ColorUtils.HSVtoRGB(400+0.33, 1, 1);
  }

  addPoint(playerIndex, points = 1) {
    this.score[playerIndex] += points
  }

  max() {
    return 10;
  }

  restart() {
    this.score = [0,0];
  }

  winner(){
    let winner = false;
    if (this.score[0] == this.max()){
      winner = 1;
    }
    else if(this.score[1] == this.max()){
      winner = 2;
    }
    if(winner){
      this.restart();
    }
    return winner;
  }
}

module.exports = {
  game: new Game()
}
