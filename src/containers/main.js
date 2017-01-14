import * as React from 'react'
import { connect } from 'react-redux'
import { default as warroStripes } from '../geometry/warro'
import { default as Geometry } from '../geometry/geometry'

import { } from '../function/blink'
import { } from '../function/blink2'
import { } from '../function/rainbow'
import { } from '../function/turned-off'
import { } from '../function/histogram'
import { } from '../function/vertical'

const ProgramNames = ['blink', 'blink2', 'rainbow', 'turned-off', 'histogram', 'vertical']

import { default as Lights } from '../geometry/canvas'

class Item extends React.Component {
  render() {
    return <li><a href="#" onClick={this.props.onClick}>{this.props.children}</a></li>
  }
}

export class Simulator extends React.Component {
  constructor() {
    super(...arguments)
    const Programs = this.Programs = this.getPrograms();
    const initial = 'vertical'
    this.state = {
      selected: [initial],
      overrideTriangle: true,
      Programs,
      func: new (Programs[initial].func)()
    }

    this.leds = []

    const geometry = new Geometry(warroStripes)
    this.config = {
      frequencyInHertz: 60,
      numberOfLeds: geometry.leds
    }

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
      this.getConfig(),
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

  handleClick(key, ev) {
    ev.preventDefault()
    this.setCurrentProgram(key)
  }

  getConfig() {
    return this.config
  }

  setCurrentProgram(name) {
    this.setState({
      selected: [name],
      func: new (this.getProgram(name).func)()
    })
  }

  getProgram(name) {
    const mod = require('../function/' + name);
    return {
      name: name,
      config: mod.config,
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
    this.leds = leds
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
        <Lights width="720" height="500" stripes={warroStripes} getColor={this.getLeds}/>
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
