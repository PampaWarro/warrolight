if (!window.socket) {
    window.socket = io();
}

class LightsSimulator extends React.Component {
    constructor() {
        super(...arguments);

        this.state = {
            renderingEnabled: false
        };

        this.lastFrameTime = performance.now();
        this.lastFPS = 0;
        this.frameCount = 0;
    }

    componentDidMount() {
        socket.emit('startSamplingLights', layout => {
            this.geometryX = layout.geometry.x;
            this.geometryY = layout.geometry.y;
            this.minX = _.min(this.geometryX);
            this.minY = _.min(this.geometryY);
            this.maxX = _.max(this.geometryX);
            this.maxY = _.max(this.geometryY);
        });

        socket.on('lightsSample', lights => {
            this.drawCanvas(lights);
        });
    }

    componentWillUnmount() {
        //this.stopCurrent()
    }

    componentDidUpdate(oldProps, oldState) {
        if (oldState.func !== this.state.func) {
            //this.startCurrent()
        }
    }

    drawCanvas(lights) {
        const drawStartTime = performance.now();

        const leds = this.geometryX.length;
        const ctx = this.refs.canvas.getContext('2d');

        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.props.width, this.props.height);

        ctx.globalCompositeOperation = 'lighter';

        if (this.state.renderingEnabled) {
            const X = this.geometryX;
            const Y = this.geometryY;

            for (let i = 0; i < leds; i++) {
                const [r, g, b] = lights[i];

                const x = X[i] * 9 + 50;
                const y = Y[i] * 9 + 50;

                let power = r + g + b;
                if (power < 0) power = 0;

                let lightRadius = (40 + (r + g + b) / (255 * 3) * 80) * 1;

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

                lightRadius = lightRadius / 24;
                ctx.fillStyle = `rgba(${or}, ${og}, ${ob}, 1)`;

                // let gradient = ctx.createRadialGradient(x, y, 0, x, y, lightRadius)
                // gradient.addColorStop(0,     `rgba(${or}, ${og}, ${ob}, 1)`)
                // // gradient.addColorStop(0.065, `rgba(${or}, ${og}, ${ob}, 1)`)
                // gradient.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, 1)`)
                // // gradient.addColorStop(0.25,  `rgba(${r}, ${g}, ${b}, 0.5)`)
                // gradient.addColorStop(0.5,   `rgba(${r}, ${g}, ${b}, 0.25)`)
                // // gradient.addColorStop(1,     `rgba(${0}, ${0}, ${0}, 1)`)
                // gradient.addColorStop(1,   `rgba(${r}, ${g}, ${b}, 0)`)
                // ctx.fillStyle = gradient


                ctx.arc(x, y, lightRadius, Math.PI * 2, false);
                ctx.fill();
            }

            this.frameCount++;

            let drawMilliseconds = performance.now() - drawStartTime;
            let timeSinceLastFPS = performance.now() - this.lastFrameTime;
            if (timeSinceLastFPS > 100) {
                this.lastFPS = 1000 * this.frameCount / timeSinceLastFPS;
                this.frameCount = 0;
                this.lastFrameTime = performance.now();
            }

            ctx.fillStyle = 'white';
            ctx.font = "12px sans-serif";

            ctx.fillText(`Sim overhead FPS: ${Math.floor(1000 / drawMilliseconds)}`, 10, 40);
            ctx.fillText(`FPS: ${this.lastFPS.toFixed(1)}`, 10, 20);
        }
    }

    __changeSelection() {
        this.setState({ renderingEnabled: !this.state.renderingEnabled });
    }

    render() {
        return React.createElement(
            'div',
            { className: 'lights-sim' },
            React.createElement(
                'div',
                null,
                React.createElement('input', { type: 'checkbox', 'data-id': 'renderToggle', checked: this.state.renderingEnabled,
                    onChange: this.__changeSelection.bind(this) }),
                React.createElement(
                    'label',
                    null,
                    'Simular'
                )
            ),
            React.createElement('canvas', { ref: 'canvas', width: this.props.width, height: this.props.height })
        );
    }
}

//# sourceMappingURL=lightsSimulator.js.map