import React from "react";
import { mat4, vec3 } from "gl-matrix";
import _ from "lodash";

interface Layout {
  geometryX: number[];
  geometryY: number[];
  geometryZ: number[];
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

type Light = [number, number, number];

interface Props {
  width: number;
  height: number;
  onStart(): void;
  onStop(): void;
  receivingData: boolean;
}

interface State {
  layout: Layout | null;
}

export class LightsSimulator extends React.Component<Props, State> {
  lightsRenderer: Canvas3DLightsRenderer;
  mouseDownCoordinates: [number, number] | null = null;
  mouseDownXAngle: number | null = null;
  mouseDownYAngle: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = { layout: null };

    this.lightsRenderer = new Canvas3DLightsRenderer();
    this.lightsRenderer.enabled = this.props.receivingData;
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

    this.lightsRenderer.draw(lights);

    this.lightsRenderer.drawDebugInfo();
  }

  updateLayout(layout: Layout) {
    this.setState({ layout });
    this.lightsRenderer.setLayout(layout);
  }

  toggleRenderPreview() {
    if (this.lightsRenderer.enabled) {
      this.turnOffSimulation();
    } else {
      this.turnOnSimulation();
    }
  }

  setCanvas(canvas: HTMLCanvasElement | null) {
    this.lightsRenderer.canvas = canvas;
  }

  mouseDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    this.mouseDownCoordinates = [e.clientX, e.clientY];
    this.mouseDownXAngle = this.lightsRenderer.xAngle;
    this.mouseDownYAngle = this.lightsRenderer.yAngle;
  }

  mouseUp(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    const coordinates = [e.clientX, e.clientY];
    if (_.isEqual(coordinates, this.mouseDownCoordinates)) {
      this.toggleRenderPreview();
    }
    this.mouseDownCoordinates = null;
    this.mouseDownXAngle = null;
    this.mouseDownYAngle = null;
  }

  mouseMove(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!this.mouseDownCoordinates) {
      return;
    }
    const coordinates = [e.clientX, e.clientY];
    const diff = [
      coordinates[0] - this.mouseDownCoordinates[0],
      coordinates[1] - this.mouseDownCoordinates[1]
    ];
    const scale = 0.01;
    this.lightsRenderer.yAngle = this.mouseDownYAngle! - scale * diff[0];
    this.lightsRenderer.xAngle = this.mouseDownXAngle! + scale * diff[1];
  }

  render() {
    return (
      <div className="lights-simulator">
        <div className="preview-area">
          <canvas
            onMouseDown={this.mouseDown.bind(this)}
            onMouseUp={this.mouseUp.bind(this)}
            onMouseLeave={this.mouseUp.bind(this)}
            onMouseMove={this.mouseMove.bind(this)}
            ref={this.setCanvas.bind(this)}
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

abstract class LightsRenderer {
  enabled: boolean;
  lastFrameTime: number;
  lastFPS: number;
  frameCount: number;
  _canvas: HTMLCanvasElement | null = null;
  private _layout: Layout | null = null;

  constructor() {
    this.enabled = false;
    this.lastFrameTime = performance.now();
    this.lastFPS = 0;
    this.frameCount = 0;
  }

  get canvas() {
    return this._canvas;
  }

  set canvas(canvas: HTMLCanvasElement | null) {
    this._canvas = canvas;
  }

  get layout() {
    return this._layout;
  }

  setLayout(layout: Layout | null) {
    this._layout = layout;
  }

  draw(lights: Light[]) {
    if (!this.enabled || !this.layout) {
      return;
    }
    if (this.canvas == null) {
      return;
    }

    this._draw(this.canvas!, lights);

    this.frameCount++;
    let now = performance.now();

    let timeSinceLastFPS = now - this.lastFrameTime;
    if (timeSinceLastFPS > 100) {
      this.lastFPS = (1000 * this.frameCount) / timeSinceLastFPS;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }

  protected abstract _draw(canvas: HTMLCanvasElement, lights: Light[]): void;

  drawDebugInfo() {
    const canvas = this.canvas;
    if (canvas == null) {
      return;
    }
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#999";
    if (this.lastFPS < 30) {
      ctx.fillStyle = "#f00";
    }
    ctx.font = "12px sans-serif";

    ctx.fillText(`FPS: ${this.lastFPS.toFixed(1)}`, 10, 20);
  }
}

// 3D Renderer.
class Canvas3DLightsRenderer extends LightsRenderer {
  _projectedLeds: vec3[] | null = null;
  _scale = 1;
  _xAngle = 0;
  _yAngle = 0;
  _frontArrowPoints: vec3[] | null = null;

  setLayout(layout: Layout | null) {
    super.setLayout(layout);
    this.invalidateProjection();
  }

  get scale() {
    return this._scale;
  }

  set scale(scale: number) {
    this._scale = scale;
    this.invalidateProjection();
  }

  get xAngle() {
    return this._xAngle;
  }

  set xAngle(rad: number) {
    this._xAngle = rad;
    this.invalidateProjection();
  }

  get yAngle() {
    return this._yAngle;
  }

  set yAngle(rad: number) {
    this._yAngle = rad;
    this.invalidateProjection();
  }

  invalidateProjection() {
    this._projectedLeds = null;
  }

  updateProjection() {
    if (!this.layout || !this.canvas) {
      return;
    }
    const layout = this.layout;
    const canvas = this.canvas;

    let transform = mat4.create();
    const width = layout.maxX - layout.minX;
    const height = layout.maxY - layout.minY;
    const depth = layout.maxZ - layout.minZ;

    // Screen projection.
    const padding = 20;
    const scaleX = (canvas.width - 2 * padding) / (layout.maxX - layout.minX);
    const scaleY = (canvas.height - 2 * padding) / (layout.maxY - layout.minY);
    const scale = Math.min(scaleX, scaleY);
    transform = mat4.translate(mat4.create(), transform, [padding, padding, 0]);
    transform = mat4.scale(mat4.create(), transform, [scale, scale, scale]);

    // Rotation and scale around geometry center.
    const centerX = (layout.minX + layout.maxX) / 2;
    const centerY = (layout.minY + layout.maxY) / 2;
    const centerZ = (layout.minZ + layout.maxZ) / 2;
    transform = mat4.translate(mat4.create(), transform, [
      centerX,
      centerY,
      centerZ
    ]);
    transform = mat4.rotateX(mat4.create(), transform, this.xAngle);
    transform = mat4.rotateY(mat4.create(), transform, this.yAngle);
    transform = mat4.scale(mat4.create(), transform, [
      this.scale,
      this.scale,
      this.scale
    ]);
    transform = mat4.translate(mat4.create(), transform, [
      -centerX,
      -centerY,
      -centerZ
    ]);

    // Map geometry using transform matrix.
    this._projectedLeds = _.zip(
      layout.geometryX,
      layout.geometryY,
      layout.geometryZ
    ).map(led => vec3.transformMat4(vec3.create(), led as number[], transform));

    const arrowLength = Math.max(width, height, depth) / 30;
    const [cX, cY, cZ] = [layout.maxX - arrowLength, layout.maxY, centerZ];
    const arrowPoints = [
      vec3.fromValues(cX, cY, cZ),
      vec3.fromValues(cX + arrowLength, cY, cZ),
      vec3.fromValues(cX, cY - arrowLength, cZ),
      vec3.fromValues(cX, cY, cZ - arrowLength),
    ];
    this._frontArrowPoints = arrowPoints.map(
        point => vec3.transformMat4(vec3.create(), point, transform));
  }

  get projectedLeds() {
    if (!this._projectedLeds) {
      this.updateProjection();
    }
    return this._projectedLeds;
  }

  _draw(canvas: HTMLCanvasElement, lights: Light[]) {
    if (!this.projectedLeds) {
      return;
    }
    const ctx = canvas.getContext("2d")!;

    // Draw leds.
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "lighter";

    const leds = this.projectedLeds.length;

    for (let i = 0; i < leds; i++) {
      const [r, g, b] = lights[i];
      const [x, y, z] = this.projectedLeds[i] as any;

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

      let lightRadius =
        (Math.exp(-0.0015 * z) * (40 + ((r + g + b) / (255 * 3)) * 80)) / 24;

      ctx.fillStyle = `rgba(${or}, ${og}, ${ob}, 1)`;

      ctx.arc(x, y, lightRadius, 0, Math.PI * 2, false);
      ctx.fill();
    }

    // Draw red arrow pointing front (to help with orientation).
    let [center, x, y,z] = this._frontArrowPoints!;

    ctx.lineWidth = 2;
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(center[0], center[1]);
    ctx.lineTo(x[0], x[1]);
    ctx.stroke();

    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(center[0], center[1]);
    ctx.lineTo(y[0], y[1]);
    ctx.stroke();

    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(center[0], center[1]);
    ctx.lineTo(z[0], z[1]);
    ctx.stroke();


    // this.xAngle += 0.005;
    // this.yAngle += 0.01;
    // this.scale *= 0.999;
  }
}
