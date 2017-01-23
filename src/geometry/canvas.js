import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { default as Geometry } from './geometry'


/**
 * We need a regex that matches stuff like #FF00DD and groups the three 0-255 values
 */
const hexRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i

/**
 * Returns an array of three elements with the 0-255 values for R, G, B
 */
export function hexToRgb(hex) {
  var result = hexRegex.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null
}

export default class Canvas extends React.Component {
  constructor() {
    super(...arguments)
    this.getColor = this.props.getColor
    this.geometry = new Geometry(
      this.props.stripes,
      this.props.width,
      this.props.height,
      this.props.xMargin || 10,
      this.props.yMargin || 10
    )
    this.state = {}

    this.lastFrameTime = performance.now();
    this.lastCall = new Date().getTime()
  }

  componentWillReceiveProps(newProps) {
    this.getColor = newProps.getColor
    this.geometry = new Geometry(
      newProps.stripes,
      newProps.width,
      newProps.height,
      newProps.xMargin || 10,
      newProps.yMargin || 10
    )
  }

  componentDidMount() {
    this.getNextFrame()
  }

  getNextFrame() {
    const newCall = new Date().getTime()
    // console.log('FPS:', 1000/(newCall - this.lastCall))
    const request = window.requestAnimationFrame(
      this.getNextFrame.bind(this), ReactDOM.findDOMNode(this.refs.canvas)
    )
    this.drawCanvas()
    this.setState({ request })
    this.lastCall = newCall
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.state.request)
  }

  getColor(index) {
    return this.getColor(index)
  }

  render() {
    return <canvas ref="canvas" width={this.props.width} height={this.props.height} />
  }

  drawCanvas() {
    const drawStartTime = performance.now();

    const leds = this.geometry.leds
    const ctx = this.refs.canvas.getContext('2d')

    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, this.props.width, this.props.height)

    ctx.globalCompositeOperation = 'lighter'

    const X = this.geometry.x
    const Y = this.geometry.y

    for (let i = 0; i < leds; i++) {
      const color = this.getColor(i)
      if (color === undefined) {
        return
      }
      const [r, g, b] = hexToRgb(color)
      const x = X[i]
      const y = Y[i]

      let power = (r + g + b - 150) * 2
      if (power < 0) power = 0

      let lightRadius = (20 + (r + g + b) / (255 * 3) * 80) * 0.7

      let [or, og, ob] = [r + power, g + power, b + power]
      if (or > 255) or = 255
      if (og > 255) og = 255
      if (ob > 255) ob = 255

      ctx.beginPath()

      // ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
      lightRadius = lightRadius /6;

      let gradient = ctx.createRadialGradient(x, y, 0, x, y, lightRadius)
      gradient.addColorStop(0,     `rgba(${or}, ${og}, ${ob}, 1)`)
      // gradient.addColorStop(0.065, `rgba(${or}, ${og}, ${ob}, 1)`)
      gradient.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, 1)`)
      // gradient.addColorStop(0.25,  `rgba(${r}, ${g}, ${b}, 0.25)`)
      // gradient.addColorStop(0.5,   `rgba(${r}, ${g}, ${b}, 0.12)`)
      gradient.addColorStop(1,     `rgba(${0}, ${0}, ${0}, 1)`)
      ctx.fillStyle = gradient


      ctx.arc(x, y, lightRadius, Math.PI * 2, false)
      ctx.fill()
    }
    let drawMilliseconds = performance.now() - drawStartTime;
    let lastFrameMilliseconds = performance.now() - this.lastFrameTime;
    this.lastFrameTime = performance.now();

    ctx.fillStyle = 'white'
    ctx.font = "12px sans-serif";
    ctx.fillText(`Max FPS: ${Math.floor(1000/drawMilliseconds)}`, 10, 20);
    ctx.fillText(`Real FPS: ${Math.floor(1000/lastFrameMilliseconds)}`, 10, 40);

  }
}
