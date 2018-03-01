if (!window.socket) {
  window.socket = io();
}

class Simulator extends React.Component {
  constructor() {
    super(...arguments);

    this.config = {
      frequencyInHertz: 60
    };

    this.programs = [];
    const initial = 'blink';

    this.state = {
      selected: null,
      programs: []
    };

    this.leds = [];

    this.getLeds = index => this.leds[index];
  }

  startCurrent() {}

  stopCurrent() {}

  _initializeState(state) {
    this.setState({
      programs: _.keyBy(state.programs, 'name'),
      selected: state.currentProgramName,
      currentConfig: state.currentConfig
    });
    console.log(state);
  }

  _stateChange(state) {
    this.setState({
      selected: state.currentProgramName,
      currentConfig: state.currentConfig,
      remoteChange: true
    });

    console.log(state.currentProgramName, state.currentConfig);
  }

  componentDidMount() {
    socket.on('completeState', this._initializeState.bind(this));
    socket.on('stateChange', this._stateChange.bind(this));
  }

  componentWillUnmount() {
    //this.stopCurrent()
  }

  componentWillUpdate(newProps, newState) {
    if (this.state.currentConfig !== newState.currentConfig && !newState.remoteChange) {
      console.log("ENTIRE CHANGING TO", newState.currentConfig);
      socket.emit("updateConfigParam", newState.currentConfig);
    }
  }

  componentDidUpdate(oldProps, oldState) {
    if (oldState.func !== this.state.func) {
      //this.startCurrent()
    }
  }

  handleProgramClick(key, ev) {
    ev.preventDefault();
    this.setCurrentProgram(key);
  }

  setCurrentProgram(name) {
    socket.emit("setCurrentProgram", name);
  }

  updateLeds(leds) {
    this.props.send(leds);
    this.leds = leds;
    this.refs.simulator.getNextFrame();
  }

  selectPreset(preset) {
    socket.emit("setPreset", preset);
  }

  restartProgram() {
    socket.emit("restartProgram");
  }

  render() {
    let menuItems = [];
    for (let key in this.state.programs) {
      if (key === this.state.selected) {
        menuItems.push(React.createElement(
          Item,
          { key: key, className: 'selected' },
          this.state.programs[key].name
        ));
      } else {
        menuItems.push(React.createElement(
          Item,
          { key: key,
            onClick: e => this.handleProgramClick(key, e) },
          this.state.programs[key].name
        ));
      }
    }

    let configOptions = [];
    let presets = [];
    let currentProgram = { name: "NO SELECTED PROGRAM" };
    if (this.state.selected) {
      currentProgram = this.state.programs[this.state.selected];

      for (let paramName in currentProgram.config) {
        let val = this.state.currentConfig[paramName];
        if (_.isBoolean(currentProgram.config[paramName].default)) {
          configOptions.push(React.createElement(BooleanParam, { key: paramName, configDefinition: currentProgram.config[paramName],
            configRef: this.state.currentConfig, val: val, field: paramName }));
        } else {
          configOptions.push(React.createElement(NumberParam, { key: paramName, configDefinition: currentProgram.config[paramName],
            configRef: this.state.currentConfig, val: val, field: paramName }));
        }
      }

      for (let preset of currentProgram.presets) {
        presets.push(React.createElement(
          'a',
          { className: 'preset', href: '#', key: preset, onClick: e => this.selectPreset(preset) },
          preset,
          ' '
        ));
      }
    }

    let geometryX = [0];
    let geometryY = [0];
    //<LightsCanvas width="400" height="10" geometryX={geometryX} geometryY={geometryY} getColor={this.getLeds}/>

    {
      return React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { className: 'contain' },
          React.createElement(CnxStatus, null),
          React.createElement(
            'div',
            null,
            React.createElement(
              'h2',
              null,
              'Pampa Warro Lights'
            )
          ),
          React.createElement(DevicesStatus, null),
          React.createElement('div', { className: 'simulator' }),
          React.createElement(
            'div',
            { className: 'controls' },
            React.createElement(
              'div',
              { className: 'menuItems' },
              menuItems
            ),
            React.createElement(
              'div',
              { className: 'simControls' },
              React.createElement(
                'div',
                { className: 'configuration' },
                React.createElement(
                  'h3',
                  null,
                  this.state.selected,
                  ' \xA0',
                  React.createElement(
                    'a',
                    { href: 'javascript:void(0);', onClick: e => this.restartProgram() },
                    'restart'
                  )
                ),
                React.createElement(
                  'div',
                  { className: 'config-items' },
                  configOptions
                ),
                presets
              ),
              React.createElement(LightsSimulator, { height: '400', width: '600' })
            )
          ),
          React.createElement(MicrophoneViewer, null)
        )
      );
    }
  }
}

class Item extends React.Component {
  render() {
    return React.createElement(
      'a',
      { href: '#', onClick: this.props.onClick },
      this.props.children
    );
  }
}

class NumberParam extends React.Component {
  constructor(props) {
    super(props);
    this.field = props.field;
    this.min = (props.configDefinition || {}).min || 0;
    this.max = (props.configDefinition || {}).max || 100;
    this.step = (props.configDefinition || {}).step || 1;
    this.state = { value: props.val, configRef: props.configRef };
    this.handleChange = this.handleChange.bind(this);
    this.name = "" + Math.random();
  }

  handleChange(event) {
    this.setVal(event.target.value);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ value: nextProps.val, configRef: nextProps.configRef });
  }

  setVal(val) {
    let value = parseFloat(val);
    this.setState({ value: value, configRef: this.state.configRef });
    this.state.configRef[this.field] = value;
    console.log("PARAM CHANGE", this.state.configRef);
    socket.emit('updateConfigParam', this.state.configRef);
  }

  render() {
    return React.createElement(
      'div',
      { className: 'config-item' },
      React.createElement(
        'span',
        null,
        this.field,
        ':\xA0'
      ),
      React.createElement(
        'div',
        null,
        React.createElement(
          'strong',
          null,
          this.state.value,
          '\xA0'
        ),
        React.createElement('input', { type: 'range', name: this.name, min: this.min, step: this.step, max: this.max, value: this.state.value,
          onChange: this.handleChange })
      )
    );
  }
}

class BooleanParam extends React.Component {
  constructor(props) {
    super(props);
    this.field = props.field;
    this.state = { value: props.val, configRef: props.configRef };
    this.handleChange = this.handleChange.bind(this);
    this.name = "" + Math.random();
  }

  handleChange(event) {
    this.setVal(event.target.checked);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ value: nextProps.val, configRef: nextProps.configRef });
  }

  setVal(val) {
    let value = val;
    this.state.configRef[this.field] = value;
    this.setState({ value: value });
    console.log("BOOL PARAM CHANGE", this.state.configRef);
    socket.emit('updateConfigParam', this.state.configRef);
  }

  render() {
    return React.createElement(
      'div',
      { className: 'config-item' },
      React.createElement(
        'span',
        null,
        this.field,
        ':\xA0'
      ),
      React.createElement(
        'div',
        null,
        React.createElement(
          'strong',
          null,
          this.state.value,
          '\xA0'
        ),
        React.createElement('input', { type: 'checkbox', name: this.name, checked: this.state.value, onChange: this.handleChange })
      )
    );
  }
}

//# sourceMappingURL=simulator.js.map