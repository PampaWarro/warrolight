import * as React from 'react'
import { connect } from 'react-redux'
const randomcolor = require('randomcolor')

import { } from '../function/blink'
import { } from '../function/blink2'
import { } from '../function/rainbow'
import { } from '../function/turned-off'
import { } from '../function/histogram'

import { LedSimulator } from './simulator-canvas'

const ProgramNames = ['blink', 'blink2', 'rainbow', 'turned-off', 'histogram']

class Item extends React.Component {
  render() {
    return <li><a href="#" onClick={this.props.onClick}>{this.props.children}</a></li>
  }
}

export class Simulator extends React.Component {
  constructor() {
    super(...arguments)
    const Programs = this.getPrograms();
    const initial = 'blink'
    this.state = { selected: [initial], Programs }
    this.func = new (Programs[initial].func)()
  }
  handleClick(key, ev) {
    ev.preventDefault()
    this.props.setCurrentProgram(key)
    this.setState({ selected: [key] })

    this.func.stop()
    this.func = new (this.state.Programs[key].func)()
    const self = this
    this.func.start({
      frequencyInHertz: 0.02,
      numberOfLeds: 150
    }, function(leds) {
      self.updateLeds(leds)
    }, () => ({}))
  }
  componentWillMount() {
    const self = this
    this.func.start({
      numberOfLeds: 150,
      frequencyInHertz: 0.02
    }, function(leds) {
      self.updateLeds(leds)
    }, () => ({}))

    this.setState({ Programs: this.getPrograms() })
  }

  getPrograms() {
    const Programs = {}
    for (let program of ProgramNames) {
      const mod = require('../function/' + program);
      Programs[program] = {
        name: program,
        config: mod.config,
        func: mod.Func
      }
    }
    return Programs
  }

  updateLeds(leds) {
    this.props.send(leds)
    if (this.refs.simulator) {
      this.refs.simulator.setTiles(leds)
    }
  }
  componentWillUnmount() {
    this.func.stop()
  }
  render() {
    var menuItems = [];
    for (var key in this.state.Programs){
      menuItems.push( <Item key={key} onClick={this.handleClick.bind(this, key)}>{this.state.Programs[key].name}</Item>)
    }
    return (<div>
      <div>
        <h2>Simulator</h2>
        <h3>Current Program: { this.state.Programs[this.state.selected[0]].name } </h3>
        <ul>{ menuItems }</ul>
        <LedSimulator ref='simulator' />
      </div>
    </div>)
  }
}

export default connect(state => state.program || {}, {
  setCurrentProgram: (name) => ({
    type: 'set current program',
    name
  }),
  send: (leds) => ({
    type: 'send',
    payload: leds
  })
})(Simulator)
