import React from "react";
import { mat4, vec3 } from "gl-matrix";
import _ from "lodash";
import * as THREE from "three";
import Stats from "stats.js";
import glow from "./glow.png";

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
  real3d?: boolean;
  stats?: boolean;
}

interface State {
  layout: Layout | null;
}

export class LightsSimulator extends React.Component<Props, State> {
  lightsRenderer: LightsRenderer;
  mouseDownCoordinates: [number, number] | null = null;
  mouseDownXAngle: number | null = null;
  mouseDownYAngle: number | null = null;
  container?: HTMLDivElement;
  stats?: Stats;

  constructor(props: Props) {
    super(props);

    this.state = { layout: null };

    const Renderer = props.real3d? Real3DLightsRenderer : Fake3DLightsRenderer;
    this.lightsRenderer = new Renderer();
    this.lightsRenderer.enabled = this.props.receivingData;
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onFocusChange = this.onFocusChange.bind(this);
    if (this.props.stats) {
      this.stats = new Stats();
      this.stats.dom.style.cssText = "";
      this.stats.dom.style.position = "absolute";
      this.stats.dom.style.top = "0";
      this.stats.dom.style.opacity = "0.4";
    }
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

    this.stats?.begin();
    this.lightsRenderer.draw(lights);
    this.stats?.end();
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
    this.lightsRenderer.setCanvas(canvas);
  }

  private setContainer(container: HTMLDivElement | null) {
    if (container === this.container) {
      return;
    }
    this.container = container ?? undefined;
    if (container && this.stats) {
      container.appendChild(this.stats.dom);
    }
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
    this.lightsRenderer.setYAngle(this.mouseDownYAngle! - scale * diff[0]);
    this.lightsRenderer.setXAngle(this.mouseDownXAngle! + scale * diff[1]);
  }

  render() {
    return (
      <div className="lights-simulator">
        <div className="preview-area" ref={this.setContainer.bind(this)}>
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
  _canvas: HTMLCanvasElement | null = null;
  private _layout: Layout | null = null;
  _xAngle = 0;
  _yAngle = 0;

  constructor() {
    this.enabled = false;
  }

  get canvas() {
    return this._canvas;
  }

  setCanvas(canvas: HTMLCanvasElement | null) {
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
  }

  protected abstract _draw(canvas: HTMLCanvasElement, lights: Light[]): void;

  get xAngle() {
    return this._xAngle;
  }

  setXAngle(rad: number) {
    this._xAngle = rad;
  }

  get yAngle() {
    return this._yAngle;
  }

  setYAngle(rad: number) {
    this._yAngle = rad;
  }
}

// Fake Canvas 2d renderer.
class Fake3DLightsRenderer extends LightsRenderer {
  _projectedLeds: vec3[] | null = null;
  _frontArrowPoints: vec3[] | null = null;

  setLayout(layout: Layout | null) {
    super.setLayout(layout);
    this.invalidateProjection();
  }

  setXAngle(rad: number) {
    super.setXAngle(rad);
    this.invalidateProjection();
  }

  setYAngle(rad: number) {
    super.setYAngle(rad);
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
    ).map(led => vec3.transformMat4(vec3.create(), led as [number, number, number], transform));

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
  }
}

// Three.js based renderer.
class Real3DLightsRenderer extends LightsRenderer {
  private renderer?: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private axes: THREE.AxesHelper;
  private bufferGeometry: THREE.BufferGeometry;

  constructor() {
    super();
    this.camera = new THREE.PerspectiveCamera(
      /*fov=*/ 13,
      /*aspect=*/ 1,
      /*near=*/ 1,
      /*far=*/ 2000
    );
    this.camera.position.z = 7;
    this.scene = new THREE.Scene();
    this.scene.scale.y = -1;
    this.camera.lookAt(this.scene.position);
    this.bufferGeometry = new THREE.BufferGeometry();
    this.resetPositionBuffer(new Float32Array());
    this.resetColorBuffer(new Float32Array());
    this.resetSizeBuffer(new Float32Array());
    const loader = new THREE.TextureLoader();
    const sprite = loader.load(glow);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color(0xffffff) },
        pointTexture: {
          value: sprite
        }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
          gl_PointSize = size * ( 300.0 / -mvPosition.z ) * 0.5;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        void main() {
          vec4 textureValue = texture2D( pointTexture, gl_PointCoord );
          gl_FragColor = vec4( baseColor * vColor, 1.0 );
          gl_FragColor = gl_FragColor * textureValue;
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });
    const leds = new THREE.Points(this.bufferGeometry, material);
    this.scene.add(leds);
    this.axes = new THREE.AxesHelper(.05);
    this.axes.scale.y = -1;
    this.scene.add(this.axes);
  }


  private resetPositionBuffer(buffer: Float32Array) {
    this.bufferGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(buffer, 3)
    );
  }

  private resetColorBuffer(buffer: Float32Array) {
    this.bufferGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(buffer, 3)
    );
  }

  private resetSizeBuffer(buffer: Float32Array) {
    this.bufferGeometry.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(buffer, 1)
    );
  }

  setCanvas(canvas: HTMLCanvasElement | null) {
    super.setCanvas(canvas);
    if (!canvas) {
      this.camera.aspect = 1;
      delete this.renderer;
      return;
    }
    this.camera.aspect = canvas.width / canvas.height;
    this.camera.updateProjectionMatrix();
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
  }

  setLayout(layout: Layout | null) {
    super.setLayout(layout);
    const points = layout? _.zip(
      layout.geometryX,
      layout.geometryY,
      layout.geometryZ
    ) : [];
    if (this.bufferGeometry.attributes.position.count !== points.length) {
      this.resetPositionBuffer(new Float32Array(points.length * 3));
    }
    const width = layout? layout.maxX - layout.minX : 0;
    const height = layout? layout.maxY - layout.minY : 0;
    const depth = layout? layout.maxZ - layout.minZ : 0;
    const centerX = layout? (layout.minX + layout.maxX) / 2 : 0;
    const centerY = layout? (layout.minY + layout.maxY) / 2 : 0;
    const centerZ = layout? (layout.minZ + layout.maxZ) / 2 : 0;
    const maxDim = 1.5 * Math.max(width, height, depth) ?? 1;
    const position = this.bufferGeometry.attributes
      .position as THREE.BufferAttribute;
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      let [x, y, z] = point as [number, number, number];
      x -= centerX;
      y -= centerY;
      z -= centerZ;
      x /= maxDim / 2;
      y /= maxDim / 2;
      z /= maxDim / 2;
      (position.array as any)[3 * i] = x;
      (position.array as any)[3 * i + 1] = y;
      (position.array as any)[3 * i + 2] = z;
    }
    this.axes.position.x = (layout?.maxX ?? 0) / maxDim;
    this.axes.position.y = (layout?.maxY ?? 0) / maxDim;
    position.needsUpdate = true;
    this.bufferGeometry.computeBoundingBox();
  }

  setColors(colors: Light[]) {
    if (this.bufferGeometry.attributes.color.count !== colors.length) {
      this.resetColorBuffer(new Float32Array(colors.length * 3));
    }
    if (this.bufferGeometry.attributes.size.count !== colors.length) {
      this.resetSizeBuffer(new Float32Array(colors.length));
    }
    const color = this.bufferGeometry.attributes.color as THREE.BufferAttribute;
    const size = this.bufferGeometry.attributes.size as THREE.BufferAttribute;
    // const pixelRatio = window.devicePixelRatio ?? 1;
    for (let i = 0; i < colors.length; i++) {
      let [r, g, b] = colors[i];
      r /= 255;
      g /= 255;
      b /= 255;

      // The goal is to create a preview as close as how then the human eye sees a LED strip.
      // Tuned experimentally, inspired on https://hackaday.com/2016/08/23/rgb-leds-how-to-master-gamma-and-hue-for-perfect-brightness/
      const gamma = 2.2;
      const invGamma = 1/ gamma;
      const gammaPower = (r**gamma+g**gamma+b**gamma)**invGamma;

      // on real life, the color brightness is almost always "maxed out", what changes is the perceived size
      // of the lit led. That's why size is the main variable reflecting brightness changes
      const power = (r+g+b)/3;
      let [or, og, ob] = [r/power, g/power, b/power];

      (color.array as any)[3 * i] = or || 0;
      (color.array as any)[3 * i + 1] = og || 0;
      (color.array as any)[3 * i + 2] = ob || 0;

      (size.array as any)[i] = (0.02+0.98*gammaPower**invGamma) || 0;
    }
    color.needsUpdate = true;
    size.needsUpdate = true;
  }

  setXAngle(rad: number) {
    super.setXAngle(rad);
    this.scene.rotation.x = rad;
  }

  setYAngle(rad: number) {
    super.setYAngle(rad);
    this.scene.rotation.y = -rad;
  }

  _draw(canvas: HTMLCanvasElement, lights: Light[]) {
    this.setColors(lights);
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
