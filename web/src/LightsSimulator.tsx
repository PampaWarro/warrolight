import React from "react";

interface Layout {
  geometryX: number[];
  geometryY: number[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

type Light = [number, number, number];

interface Props {
  width: number;
  height: number;
  onStart(): void;
  onStop(): void;
}

interface State {
  layout: Layout | null;
}

export class LightsSimulator extends React.Component<Props, State> {
  lightsRenderer: LightsRenderer;

  constructor(props: Props) {
    super(props);

    this.state = { layout: null };

    this.lightsRenderer = new LightsRenderer();
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
    if (!this.state.layout) {
      return;
    }

    this.lightsRenderer.draw(
      this.refs.canvas as HTMLCanvasElement,
      this.state.layout!,
      lights
    );
  }

  updateLayout(layout: Layout) {
    this.setState({ layout });
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
        <div className="preview-area py-3">
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
  enabled: boolean;
  lastFrameTime: number;
  lastFPS: number;
  frameCount: number;

  constructor() {
    this.enabled = true;
    this.lastFrameTime = performance.now();
    this.lastFPS = 0;
    this.frameCount = 0;
  }

  draw(canvas: HTMLCanvasElement, layout: Layout, lights: Light[]) {
    const drawStartTime = performance.now();

    const ctx = canvas.getContext("2d")!;

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "lighter";

    if (!this.enabled) {
      return;
    }

    // compute scaling factor based on canvas size
    const padding = 50;
    const scaleX = (canvas.width - padding) / (layout.maxX - layout.minX);
    const scaleY = (canvas.height - padding) / (layout.maxY - layout.minY);
    const scale = Math.min(scaleX, scaleY);

    // center layout in screen
    const width = (layout.maxX - layout.minX) * scale;
    const startX = canvas.width / 2 - width / 2;
    const height = (layout.maxY - layout.minY) * scale;
    const startY = canvas.height / 2 - height / 2;

    const leds = layout.geometryX.length;
    const X = layout.geometryX;
    const Y = layout.geometryY;

    for (let i = 0; i < leds; i++) {
      const [r, g, b] = lights[i];

      const x = X[i] * scale + startX;
      const y = Y[i] * scale + startY;

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

    let timeSinceLastFPS = now - this.lastFrameTime;
    if (timeSinceLastFPS > 100) {
      this.lastFPS = (1000 * this.frameCount) / timeSinceLastFPS;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    this.debugInfo(ctx, drawStartTime)
  }

  debugInfo(ctx: CanvasRenderingContext2D, drawStartTime: number) {

    ctx.fillStyle = "#999";
    ctx.font = "12px sans-serif";

    ctx.fillText(`FPS: ${this.lastFPS.toFixed(1)}`, 10, 20);
  }
}
