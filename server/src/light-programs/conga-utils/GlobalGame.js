class Game {
  constructor() {
    this.score = [0,0];
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
}

module.exports = {
  game: new Game()
}
