/*global socket*/
import React from "react";
import _ from "lodash";

export class LightsSimulator extends React.Component {
  constructor(props) {
    super(props);

    this.lightsRenderer = new LightsRenderer()
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onFocusChange = this.onFocusChange.bind(this);
  }

  turnOnSimulation() {
    socket.emit("startSamplingLights");
  }

  turnOffSimulation() {
    socket.emit("stopSamplingLights", layout => {});
  }

  decodeLedsColorsFromString(encodedLights) {
    let bytes = Uint8Array.from(atob(encodedLights), c => c.charCodeAt(0));

    let byLed = new Array(bytes.length / 3);
    for (let i = 0; i < bytes.length / 3; i += 1) {
      byLed[i] = [bytes[i * 3], bytes[i * 3 + 1], bytes[i * 3 + 2]];
    }
    return byLed;
  }

  onVisibilityChange() {
    if (document.hidden && this.lightsRenderer.enabled) {
      this.turnOffSimulation();
    } else if (!document.hidden && this.lightsRenderer.enabled) {
      this.turnOnSimulation();
    }
  }

  onFocusChange() {
    debugger;
    if (!document.hasFocus() && this.lightsRenderer.enabled) {
      this.turnOffSimulation();
    } else if (document.hasFocus() && this.lightsRenderer.enabled) {
      this.turnOnSimulation();
    }
  }

  componentDidMount() {
    socket.on("lightsSample", encodedLights => {
      const lights = this.decodeLedsColorsFromString(encodedLights);
      this.drawCanvas(lights);
    });

    socket.on("layout", layout => {
      let geometryX = layout.geometry.x;
      let geometryY = layout.geometry.y;
      let minX = _.min(this.geometryX);
      let minY = _.min(this.geometryY);
      let maxX = _.max(this.geometryX);
      let maxY = _.max(this.geometryY);

      const layoutObj = { geometryX, geometryY, minX, minY, maxX, maxY }
      this.setState({ layout: layoutObj })
    });

    document.addEventListener("visibilitychange", this.onVisibilityChange);
    document.onblur = this.onFocusChange;
    document.onfocus = this.onFocusChange;
  }

  componentWillUnmount() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  drawCanvas(lights) {
    this.lightsRenderer.draw(
      this.refs.canvas,
      this.state.layout,
      lights
    )
  }

  toggleRenderPreview() {
    if (this.lightsRenderer.enabled) {
      this.turnOffSimulation();
    } else {
      this.turnOnSimulation();
    }
    this.lightsRenderer.enabled = !this.lightsRenderer.enabled;
  }

  render() {
    return (
      <div className="lights-sim">
        <div>
          <input
            type="checkbox"
            data-id={"renderToggle"}
            checked={this.lightsRenderer.enabled}
            onChange={this.toggleRenderPreview.bind(this)}
          />
          <label>Preview light output from server</label>
        </div>
        <div className={"preview-area"}>
          <canvas
            onClick={this.toggleRenderPreview.bind(this)}
            ref="canvas"
            width={this.props.width}
            height={this.props.height}
          />
          {this.lightsRenderer.enabled ? null : (
            <div className={"preview-btn"}>
              Click to START / PAUSE preview of lights
            </div>
          )}
        </div>
      </div>
    );
  }
}

class LightsRenderer {
  
  constructor() {
    this.enabled = false;
    this.lastFrameTime = performance.now();
    this.lastFPS = 0;
    this.frameCount = 0;
  }

  draw(canvas, layout, lights, enabled) {
    const drawStartTime = performance.now();

    const leds = layout.geometryX.length;
    const ctx = canvas.getContext("2d");

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "lighter";

    if (this.enabled) {
      const X = layout.geometryX;
      const Y = layout.geometryY;

      for (let i = 0; i < leds; i++) {
        const [r, g, b] = lights[i];

        let SCALE = 4;
        const x = X[i] * SCALE + 5 * SCALE;
        const y = Y[i] * SCALE + 5 * SCALE;

        let power = r + g + b;
        if (power < 0) power = 0;

        let m = 2;
        if (power < 200) {
          m = 4;
        } else if (power < 100) {
          m = 8;
        } else if (power < 50) {
          m = 16;
        }
        let [or, og, ob] = [r * m, g * m, b * m];
        if (or > 255) or = 255;
        if (og > 255) og = 255;
        if (ob > 255) ob = 255;

        ctx.beginPath();

        let lightRadius = (40 + ((r + g + b) / (255 * 3)) * 80) / 24;

        ctx.fillStyle = `rgba(${or}, ${og}, ${ob}, 1)`;

        ctx.arc(x, y, lightRadius, Math.PI * 2, false);
        ctx.fill();
      }

      this.frameCount++;

      let drawMilliseconds = performance.now() - drawStartTime;
      let timeSinceLastFPS = performance.now() - this.lastFrameTime;
      if (timeSinceLastFPS > 100) {
        this.lastFPS = (1000 * this.frameCount) / timeSinceLastFPS;
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
      }

      ctx.fillStyle = "white";
      ctx.font = "12px sans-serif";

      ctx.fillText(
        `Sim overhead FPS: ${Math.floor(1000 / drawMilliseconds)}`,
        10,
        40
      );
      ctx.fillText(`FPS: ${this.lastFPS.toFixed(1)}`, 10, 20);
    }
  }
}


