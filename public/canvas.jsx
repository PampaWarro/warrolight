class LightsCanvas extends React.Component {
  constructor() {
    super(...arguments)

    this.getColor = this.props.getColor
    this.geometryX = this.props.geometryX
    this.geometryY = this.props.geometryY

    this.state = {
      renderingEnabled: true
    }

    this.lastFrameTime = performance.now();
    this.lastFPS = 0;
    this.frameCount = 0;

    this.lastCall = new Date().getTime()
  }

  componentWillReceiveProps(newProps) {
    this.getColor = newProps.getColor
    this.geometryX = newProps.geometryX
    this.geometryY = newProps.geometryY
  }

  componentDidMount() {
    this.getNextFrame()
  }

  getNextFrame() {
    const newCall = new Date().getTime()
    // console.log('FPS:', 1000/(newCall - this.lastCall))
    // const request = window.requestAnimationFrame(
    //   this.getNextFrame.bind(this), ReactDOM.findDOMNode(this.refs.canvas)
    // )
    this.drawCanvas()
    // this.setState({ request })
    this.lastCall = newCall
  }

  componentWillUnmount() {
    // window.cancelAnimationFrame(this.state.request)
  }

  getColor(index) {
    return this.getColor(index)
  }

  __changeSelection(){
    this.setState({renderingEnabled: !this.state.renderingEnabled});
  }

  render() {
    return <div>
      <div>
        <input type="checkbox" data-id={'renderToggle'} checked={this.state.renderingEnabled} onChange={this.__changeSelection.bind(this)} /><label>Simular</label>
      </div>
        <canvas ref="canvas" width={this.props.width} height={this.props.height} />
    </div>
  }

  drawCanvas() {
    const drawStartTime = performance.now();

    const leds = this.geometryX.length
    const ctx = this.refs.canvas.getContext('2d')

    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, this.props.width, this.props.height)

    ctx.globalCompositeOperation = 'lighter'

    if(this.state.renderingEnabled) {
      const X = this.geometryX
      const Y = this.geometryY

      for (let i = 0; i < leds; i++) {
        const [r, g, b] = this.getColor(i)

        const x = X[i]
        const y = Y[i]

        let power = (r + g + b)
        if (power < 0) power = 0

        let lightRadius = (10 + (r + g + b) / (255 * 3) * 80) * 1

        let m = 2;
        if(power < 200){
          m = 4;
        } else if (power < 100){
          m = 8;
        } else if (power < 50){
          m = 16;
        }
        let [or, og, ob] = [r * m, g *m, b * m]
        if (or > 255) or = 255
        if (og > 255) og = 255
        if (ob > 255) ob = 255

        ctx.beginPath()

      lightRadius = lightRadius /6;
      ctx.fillStyle = `rgba(${or}, ${og}, ${ob}, 1)`;

        // let gradient = ctx.createRadialGradient(x, y, 0, x, y, lightRadius)
        // gradient.addColorStop(0,     `rgba(${or}, ${og}, ${ob}, 1)`)
        // // gradient.addColorStop(0.065, `rgba(${or}, ${og}, ${ob}, 1)`)
        // gradient.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, 1)`)
        // // gradient.addColorStop(0.25,  `rgba(${r}, ${g}, ${b}, 0.25)`)
        // // gradient.addColorStop(0.5,   `rgba(${r}, ${g}, ${b}, 0.12)`)
        // gradient.addColorStop(1,     `rgba(${0}, ${0}, ${0}, 1)`)
        // ctx.fillStyle = gradient


        ctx.arc(x, y, lightRadius, Math.PI * 2, false)
        ctx.fill()
      }
    }

    this.frameCount++;

    let drawMilliseconds = performance.now() - drawStartTime;
    let timeSinceLastFPS = performance.now() - this.lastFrameTime;
    if(timeSinceLastFPS > 100){
      this.lastFPS = 1000*this.frameCount/timeSinceLastFPS;
      this.frameCount = 0;
      this.lastFrameTime = performance.now();
    }

    ctx.fillStyle = 'white'
    ctx.font = "12px sans-serif";



    // ctx.fillText(`Sim overhead FPS: ${Math.floor(1000/drawMilliseconds)}`, 10, 40);
    ctx.fillText(`FPS: ${this.lastFPS.toFixed(1)}`, 10, 20);

  }
}
