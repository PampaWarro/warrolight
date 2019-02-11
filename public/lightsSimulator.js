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

        this.onVisibilityChange = this.onVisibilityChange.bind(this);
        this.onFocusChange = this.onFocusChange.bind(this);
    }

    turnOnSimulation() {
        socket.emit('startSamplingLights', layout => {
            this.geometryX = layout.geometry.x;
            this.geometryY = layout.geometry.y;
            this.minX = _.min(this.geometryX);
            this.minY = _.min(this.geometryY);
            this.maxX = _.max(this.geometryX);
            this.maxY = _.max(this.geometryY);
        });
    }

    turnOffSimulation() {
        socket.emit('stopSamplingLights', layout => {});
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
        if (document.hidden && this.state.renderingEnabled) {
            this.turnOffSimulation();
        } else if (!document.hidden && this.state.renderingEnabled) {
            this.turnOnSimulation();
        }
    }

    onFocusChange() {
        debugger;
        if (!document.hasFocus() && this.state.renderingEnabled) {
            this.turnOffSimulation();
        } else if (document.hasFocus() && this.state.renderingEnabled) {
            this.turnOnSimulation();
        }
    }

    componentDidMount() {
        socket.on('lightsSample', encodedLights => {
            const lights = this.decodeLedsColorsFromString(encodedLights);
            console.log("Lights data");
            this.drawCanvas(lights);
        });

        document.addEventListener('visibilitychange', this.onVisibilityChange);
        document.onblur = this.onFocusChange;
        document.onfocus = this.onFocusChange;
    }

    componentWillUnmount() {
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        // document.removeEventListener('blur', this.onFocusChange);
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

                let SCALE = 4;
                const x = X[i] * SCALE + 5 * SCALE;
                const y = Y[i] * SCALE + 5 * SCALE;

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
        if (this.state.renderingEnabled) {
            this.turnOffSimulation();
        } else {
            this.turnOnSimulation();
        }
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