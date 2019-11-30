import React from "react";

interface Layout {
  geometryX: number[]
  geometryY: number[]
  minX: number
  minY: number
  maxX: number
  maxY: number
}

type Light = [number, number, number]

interface Props {
  width: number
  height: number
  onStart(): void
  onStop(): void
}

interface State {
  layout: Layout | null
}

export class LightsSimulator extends React.Component<Props, State> {
  lightsRenderer: LightsRenderer

  constructor(props: Props) {
    super(props);

    this.state = { layout: null }

    this.lightsRenderer = new LightsRenderer()
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onFocusChange = this.onFocusChange.bind(this);
  }

  turnOnSimulation() {
    this.lightsRenderer.enabled = true;
    this.props.onStart();
    this.forceUpdate();
  }

  turnOffSimulation() {
    this.lightsRenderer.enabled = false;
    this.props.onStop();
    this.forceUpdate();
  }

  onVisibilityChange() {
    if (document.hidden && this.lightsRenderer.enabled) {
      this.turnOffSimulation();
    } else if (!document.hidden && this.lightsRenderer.enabled) {
      this.turnOnSimulation();
    }
  }

  onFocusChange() {
    if (!document.hasFocus() && this.lightsRenderer.enabled) {
      this.turnOffSimulation();
    } else if (document.hasFocus() && this.lightsRenderer.enabled) {
      this.turnOnSimulation();
    }
  }

  componentDidMount() {
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    document.onblur = this.onFocusChange;
    document.onfocus = this.onFocusChange;
  }

  componentWillUnmount() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  drawCanvas(lights: Light[]) {
    this.lightsRenderer.draw(
      this.refs.canvas as HTMLCanvasElement,
      this.state.layout!,
      lights
    )
  }

  updateLayout(layout: Layout) {
    this.setState({ layout })
  }

  toggleRenderPreview() {
    if (this.lightsRenderer.enabled) {
      this.turnOffSimulation();
    } else {
      this.turnOnSimulation();
    }
  }

  render() {
    return (
      <div className="lights-simulator mb-3">
        <div className="preview-area py-4">
          <canvas
            onClick={this.toggleRenderPreview.bind(this)}
            ref="canvas"
            width={this.props.width}
            height={this.props.height}
          />
          {this.lightsRenderer.enabled ? null : (
            <div className="preview-btn">
              Click to START / PAUSE preview of lights
            </div>
          )}
        </div>
      </div>
    );
  }
}

class LightsRenderer {
  enabled: boolean
  lastFrameTime: number
  lastFPS: number
  frameCount: number
  
  constructor() {
    this.enabled = true;
    this.lastFrameTime = performance.now();
    this.lastFPS = 0;
    this.frameCount = 0;
  }

  draw(canvas: HTMLCanvasElement, layout: Layout, lights: Light[]) {
    const drawStartTime = performance.now();

    const leds = layout.geometryX.length;
    const ctx = canvas.getContext("2d")!;

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

        ctx.arc(x, y, lightRadius, 0, Math.PI * 2, false);
        ctx.fill();
      }

      this.frameCount++;

      let now = performance.now();

      let drawMilliseconds = now - drawStartTime;
      let timeSinceLastFPS = now - this.lastFrameTime;
      if (timeSinceLastFPS > 100) {
        this.lastFPS = (1000 * this.frameCount) / timeSinceLastFPS;
        this.frameCount = 0;
        this.lastFrameTime = now;
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


