import * as React from 'react'
import { connect } from 'react-redux'
import { default as warroStripes } from '../geometry/geometry-wchica'
import { default as Geometry } from '../geometry/geometry'

const ProgramNames = ['debugSetup',
'all-white', 'all-off', 'blink', 'pw',
'rainbow', 'stars', 'musicFlow', 'musicFreqs',
'vertical', 'radial', 'mixRainbowTriangulos', 'mixMusicW', 'mixMusicPsycho']

import { default as Lights } from '../geometry/canvas'

class Item extends React.Component {
  render() {
    return <a href="#" onClick={this.props.onClick}>{this.props.children}</a>
  }
}

export class Simulator extends React.Component {
  constructor() {
    super(...arguments)

    const geometry = new Geometry(warroStripes)

    this.config = {
      frequencyInHertz: 60
    }

    this.layout = {
      numberOfLeds: geometry.leds,
      geometry: geometry
    }

    const programs = this.programs = this.getPrograms();
    const initial = 'control';
    this.state = {
      selected: initial,
      overrideTriangle: false,
      programs,
      func: new (programs[initial].func)(this.getConfig(programs[initial].config), this.layout)
    }

    this.leds = []


    const compose = (index) => {
      const x = geometry.x[index]
      const y = geometry.y[index]
      const triangle = y < geometry.height / 2
        && x >= geometry.width / 3
        && x <= geometry.width * 2 / 3
      return triangle ? '#ff0000' : this.leds[index]
    }

    this.getLeds = (index) => {
      return this.state.overrideTriangle
        ? compose(index)
        : this.leds[index]
    }
  }

  startCurrent() {
    this.state.func.start(
      this.getConfig(this.programs[this.state.selected].config),
      (leds) => this.updateLeds(leds),
      () => ({})
    )
  }

  stopCurrent() {
    this.state.func.stop()
  }

  componentDidMount() {
    this.startCurrent()
  }

  componentWillUnmount() {
    this.stopCurrent()
  }

  componentWillUpdate(newProps, newState) {
    if (this.state.func !== newState.func) {
      this.stopCurrent()
    }
  }

  componentDidUpdate(oldProps, oldState) {
    if (oldState.func !== this.state.func) {
      this.startCurrent()
    }
  }

  handleProgramClick(key, ev) {
    ev.preventDefault()
    this.setCurrentProgram(key)
  }

  getConfig(configDef = {}) {
    for (let paramName in configDef) {
      if (this.config[paramName] === undefined && configDef[paramName].default !== undefined) {
        this.config[paramName] = configDef[paramName].default;
      }
    }
    return this.config
  }

  setCurrentProgram(name) {
    let selectedProgram = this.programs[name];
    this.setState({
      selected: name,
      func: new (selectedProgram.func)(this.getConfig(selectedProgram.config), this.layout)
    })
  }

  getProgram(name) {
    const mod = require('../function/' + name);
    return {
      name: name,
      config: mod.Func.configSchema ? mod.Func.configSchema() : mod.config,
      func: mod.Func
    }
  }

  getPrograms() {
    const Programs = {}
    for (let program of ProgramNames) {
      Programs[program] = this.getProgram(program)
    }
    return Programs
  }

  updateLeds(leds) {
    this.props.send(leds)
    this.leds = leds;
    this.refs.simulator.getNextFrame();
  }

  render() {
    let menuItems = [];
    for (let key in this.state.programs){
      if(key === this.state.selected){
        menuItems.push( <Item key={key} className="selected" onClick={e => this.handleProgramClick(key, e)}>{this.state.programs[key].name}</Item>)
      } else {
        menuItems.push( <Item key={key} onClick={e => this.handleProgramClick(key, e)}>{this.state.programs[key].name}</Item>)
      }
    }

    let currentProgram = this.state.programs[this.state.selected];

    let configOptions = [];
    for (let paramName in currentProgram.config){
      if(currentProgram.config[paramName].type === Boolean){
        configOptions.push(<BooleanParam key={paramName} configDefinition={currentProgram.config[paramName]} configRef={this.config} field={paramName}/>);
      } else {
        configOptions.push(<NumberParam key={paramName} configDefinition={currentProgram.config[paramName]} configRef={this.config} field={paramName}/>);
      }
    }

    {
      return (<div>
        <div className="contain">
          <div className="simulator">
            <h3>Current Program: { currentProgram.name } </h3>
            <Lights ref="simulator" width="600" height="346" stripes={warroStripes} getColor={this.getLeds}/>
          </div>
          <div className="controls">
            <div>
              <h2>Pampa Warro</h2>
            </div>
            <div className="menuItems">{ menuItems }</div>
            <div className="configuration">
              <h3>Configuration</h3>
              {configOptions}
            </div>
          </div>
        </div>
      </div>)
    }
  }
}

class NumberParam extends React.Component {
  constructor(props){
    super(props);
    this.configRef = props.configRef;
    this.field = props.field;
    this.min = (props.configDefinition || {}).min || 0;
    this.max = (props.configDefinition || {}).max || 100;
    this.step = (props.configDefinition || {}).step || 1;
    this.state = {value: this.getVal()}
    this.handleChange = this.handleChange.bind(this);
    this.name = ""+Math.random();
  }

  handleChange(event) {
    this.setVal(event.target.value);
  }

  getVal(){
    return  this.configRef[this.field];
  }

  setVal(val){
    let value = parseFloat(val);
    this.setState({value: value});
    this.configRef[this.field] = value;
  }

  render() {
    return (
    <div className="config-item">
      <span>{this.field}:&nbsp;</span>
      <div>
        <strong>{this.state.value}&nbsp;</strong>
        <input type="range" name={this.name} min={this.min} step={this.step} max={this.max} value={this.state.value} onChange={this.handleChange}/>
      </div>
    </div>
    );
  }
}


class BooleanParam extends React.Component {
  constructor(props){
    super(props);
    this.configRef = props.configRef;
    this.field = props.field;
    this.state = {value: this.getVal()}
    this.handleChange = this.handleChange.bind(this);
    this.name = ""+Math.random();
  }

  handleChange(event) {
    this.setVal(event.target.checked);
  }

  getVal(){
    return  this.configRef[this.field];
  }

  setVal(val){
    let value = val;
    this.setState({value: value});
    this.configRef[this.field] = value;
  }

  render() {
    return (
      <div className="config-item">
        <span>{this.field}:&nbsp;</span>
        <div>
          <strong>{this.state.value}&nbsp;</strong>
          <input type="checkbox" name={this.name} checked={this.state.value} onChange={this.handleChange}/>
        </div>
      </div>
    );
  }
}


export default connect(state => state.program || {}, {
  setCurrentProgram: (name) => ({
    type: 'set current program',
    name
  }),
  send: (leds) => ({
    type: 'send',
    msgType: 'leds',
    payload: leds
  })
})(Simulator)
