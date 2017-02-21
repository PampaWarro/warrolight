import * as React from 'react'
import { connect } from 'react-redux'
import { default as warroStripes } from '../geometry/warro'
import { default as Geometry } from '../geometry/geometry'

const ProgramNames = [
  'debugSetup', 'test1', 'heart', 'spear-blink',
  'rainbow2', 'white-spear',
  'all-white', 'all-off', 'blink', 'rainbow', 'stars', 'musicFlow', 'musicFreqs', 'vertical', 'radial',
  'mixRainbowTriangulos', 'mixMusicW', 'mixMusicPsycho',
  'multiIntro', 'multiFlor', 'multiWarroLetras', 'fire'
]

import { default as Lights } from '../geometry/canvas'

class Item extends React.Component {
  render() {
    return <a href="#" onClick={this.props.onClick}>{this.props.children}</a>
  }
}

export class Simulator extends React.Component {
  constructor() {
    super(...arguments)

    this.master = this.props.route.master

    const geometry = new Geometry(warroStripes)

    this.config = {
      frequencyInHertz: 60
    }


    this.layout = {
      numberOfLeds: geometry.leds,
      geometry: geometry
    }

    const programs = this.programs = this.getPrograms();
    const initial = 'fire';
    let initialConfig = this.getConfig(programs[initial].config);
    this.state = {
      selected: initial,
      overrideTriangle: false,
      programs,
      func: new (programs[initial].func)(initialConfig, this.layout),
      config: initialConfig
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
    if(this.master) {
      this.state.func.start(
        this.getConfig(this.programs[this.state.selected].config),
        (leds) => this.updateLeds(leds),
        () => ({})
      )
    }
  }

  stopCurrent() {
    if(this.master)
      this.state.func.stop()
  }

  componentDidMount() {
    this.startCurrent()
  }

  componentWillUnmount() {
    this.stopCurrent()
  }

  componentWillUpdate(newProps, newState) {
    if (this.master && this.state.func !== newState.func) {
      this.stopCurrent()
    }
    // Run remoteCmd
    if(newProps.program && newProps.program !== this.state.selected){
      this.setCurrentProgram(newProps.program)
    }

    if(newProps.updatedField){
      let field = newProps.updatedField.field;
      let val = newProps.updatedField.value;
      if(this.config[field] !== val){
        this.updateConfigField(field, val)
      }
    }
  }

  componentDidUpdate(oldProps, oldState) {
    if (this.master && oldState.func !== this.state.func) {
      this.startCurrent()
    }
  }

  handleProgramClick(key, ev) {
    ev.preventDefault()
    this.setCurrentProgram(key)
    this.sendSlaveCommand('setCurrentProgram', key)
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
    let updatedConfig = this.getConfig(selectedProgram.config);
    this.setState({
      selected: name,
      func: new (selectedProgram.func)(updatedConfig, this.layout),
      config: updatedConfig
    })
  }

  sendSlaveCommand(command, payload){
    this.props.sendRemoteCmd({command, payload})
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

  updateConfigField(field, value){
    this.config[field] = value;
    this.setState({
      selected: this.state.selected,
      func: this.state.func,
      config: this.config
    })
  }

  userUpdateConfigField(field, value){
    this.updateConfigField(field, value)
    this.sendSlaveCommand("updateConfigField", {field: field, value: value})
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
        configOptions.push(<BooleanParam key={paramName} configDefinition={currentProgram.config[paramName]} value={this.state.config[paramName]} updateConfig={ v => this.userUpdateConfigField(paramName, v) } field={paramName}/>);
      } else {
        configOptions.push(<NumberParam key={paramName} configDefinition={currentProgram.config[paramName]} value={this.state.config[paramName]} updateConfig={ v => this.userUpdateConfigField(paramName, v) } field={paramName}/>);
      }
    }

    let state = "Desconectado del server";
    let stateClass = "state-danger"
    if(this.props.connected){
      state = this.props.serverState || "Connected";
      stateClass = this.props.serverState == "dj-action" ? "state-warning" : "state-ok"

      if(state == "dj-action" && this.props.stateTimeRemaining){
        state += ` (quedan ${(this.props.stateTimeRemaining/1000).toFixed(1)}s)`
      }
    }

    let simulatorPart = null;
    if(this.master){
      simulatorPart = <div className="simulator">
        <h3>Current Program: { currentProgram.name } </h3>
        <Lights ref="simulator" width="600" height="346" stripes={warroStripes} getColor={this.getLeds}/>
      </div>
    } else {
      simulatorPart = <div className="simulator">
        <h3>Current Program: { currentProgram.name } </h3>
      </div>
    }

    {
      return (<div>
        <div className={"state "+stateClass}>{ state }</div>
        <div className="contain">
          {simulatorPart}
          <div className="controls">
            <div>
              <h2>Pampa Warro { this.master ? 'Master' : 'Slave' }</h2>
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
    return  this.props.value;
  }

  setVal(val){
    let value = parseFloat(val);
    this.setState({value: value});
    this.props.updateConfig(value);
  }

  render() {
    return (
    <div className="config-item">
      <span>{this.field}:&nbsp;</span>
      <div>
        <strong>{this.state.value}&nbsp;</strong>
        <input type="range" name={this.name}
        min={this.min} step={this.step} max={this.max} value={this.state.value} onChange={this.handleChange}/>
      </div>
    </div>
    );
  }
}


class BooleanParam extends React.Component {
  constructor(props){
    super(props);
    this.field = props.field;
    this.state = {value: this.getVal()}
    this.handleChange = this.handleChange.bind(this);
    this.name = ""+Math.random();
  }

  handleChange(event) {
    this.setVal(event.target.checked);
  }

  getVal(){
    return  this.props.value;
  }

  setVal(val){
    let value = val;
    this.setState({value: value});
    this.props.updateConfig(value);
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


let mapStateToProps = state => {
  let newState = {
    connected: state.connection.connected,
    serverState: state.connection.state,
    stateTimeRemaining: state.connection.stateTimeRemaining || null,
  }

  let remoteCmd = state.connection.remoteCmd;
  if(remoteCmd){
    if(remoteCmd.command == "setCurrentProgram"){
      newState.program = remoteCmd.payload;
    } else if(remoteCmd.command == "updateConfigField"){
      newState.updatedField = remoteCmd.payload;
    }
  }
  return newState
}

export default connect(mapStateToProps, {
  setCurrentProgram: (name) => ({
    type: 'set current program',
    name
  }),
  send: (leds) => ({
    type: 'send',
    msgType: 'leds',
    payload: leds
  }),
  sendRemoteCmd: (cmd) => ({
    type: 'send',
    msgType: 'remoteCmd',
    payload: cmd
  }),
})(Simulator)
