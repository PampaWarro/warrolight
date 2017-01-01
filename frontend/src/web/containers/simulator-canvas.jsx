import * as React from 'react'

const config = {
  numberOfLeds: 150
}

class Led {
  constructor() {
    //speed, life, location, life, colors
    //speed.x range = -2.5 to 2.5
    //speed.y range = -15 to -5 to make it move upwards
    //lets change the Y speed to make it look like a flame
    this.speed = {x: -2.5 + Math.random() * 5, y: -15 + Math.random() * 10};
    //location = mouse coordinates
    //Now the flame follows the mouse coordinates
    //radius range = 10-30
    this.radius = 40 + 0 * Math.random() * 5;
    //life range = 20-30
    this.life = 20 + Math.random() * 10;
    this.remaining_life = this.life;
    //colors
    this.r = Math.round(Math.random() * 255);
    this.g = Math.round(Math.random() * 255);
    this.b = Math.round(Math.random() * 255);

//      [this.r, this.g, this.b] = [Math.floor((i/150.0)*255),0,0]
  }
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
}


export class LedSimulator extends React.Component {
  constructor() {
    super(...arguments)
    this.state = {}

    const W = 600;
    const H = 500;
    //Lets create some particles now
    const particle_count = 150;
    const scaleY = ((H - 100) / 34);
    const scaleX = ((W - 100) / 150);
    const wh = 37;
    this.particles = [];

    for (let i = 0; i < particle_count; i++) {
      const p = new Led();
      p.location = {
        y: ((i % (wh * 2) >= wh ? wh * scaleY - i % wh * scaleY : i % wh * scaleY)) + 50,
        x: 50+i*scaleX
      };
      this.particles.push(p);
    }
  }

  getConfig() {
    return this.config
  }

  setTiles(tiles) {
    this.setState({tiles})
    this.updateCanvas()
  }

  componentDidMount() {
    this.updateCanvas();
  }

  updateCanvas() {
    const ctx = this.refs.canvas.getContext('2d');

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 600, 600);

    // Esto hace que RGB se sume, entonces la luminosidad se va a acumulando y los halos se suman
    ctx.globalCompositeOperation = "lighter";

    let particles = this.particles;
    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      let power = Math.max(0, p.r + p.g + p.b - 150) * 2;
      let lightRadius = (20 + (p.r + p.g + p.b) / (255 * 3) * 80) * 0.7;
      let [or, og, ob] = [Math.min(255, p.r + power), Math.min(255, p.g + power), Math.min(255, p.b + power)];

      ctx.beginPath();

      let gradient = ctx.createRadialGradient(p.location.x, p.location.y, 0, p.location.x, p.location.y, lightRadius);
      gradient.addColorStop(0, `rgba(${or}, ${og}, ${ob}, 1)`);
      gradient.addColorStop(0.065, "rgba(" + or + ", " + og + ", " + ob + ", 1)");
      gradient.addColorStop(0.125, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", 0.5)");
      gradient.addColorStop(0.25, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", 0.25)");
      gradient.addColorStop(0.5, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", 0.12)");
      gradient.addColorStop(1, "rgba(" + p.r + ", " + p.g + ", " + p.b + ", 0)");

      ctx.fillStyle = gradient;
      ctx.arc(p.location.x, p.location.y, lightRadius, Math.PI * 2, false);
      ctx.fill();
    }
  }

  drawTiles() {
    if (!this.state.tiles) {
      return
    }
    return this.state.tiles.map((tile, index) => {
      let p = this.particles[index];
      [p.r, p.g, p.b] = hexToRgb(tile);
    })
  }

  render() {
    return <canvas ref="canvas" width="600" height="600">{this.drawTiles()}</canvas>
  }
}