import * as React from 'react'
import { connect } from 'react-redux'
const randomcolor = require('randomcolor')

import { Func as blinkFunc, config as blinkConfig} from '../function/blink'
import { Func as blinkFunc2, config as blinkConfig2} from '../function/blink2'
import { Func as rainbowFunc, config as rainbowConfig} from '../function/rainbow'
import { Func as offFunc, config as offConfig} from '../function/turned-off'
import { Func as volumeFunc, config as volumeConfig} from '../function/histogram'
import { LedSimulator } from './simulator-canvas'

const Programs = {
  'blink': {
    config: blinkConfig,
    func: blinkFunc,
    name: 'Blink'
  },
  'blink2': {
    config: blinkConfig2,
    func: blinkFunc2,
    name: 'Blink blanco'
  },
  'rainbow': {
    config: rainbowConfig,
    func: rainbowFunc,
    name: 'Rainbow'
  },
  'off': {
    config: offConfig,
    func: offFunc,
    name: 'Off'
  },
  'volumeLight': {
    config: volumeConfig,
    func: volumeFunc,
    name: 'Volume light'
  }
}

export class Simulator extends React.Component {
  constructor() {
    super(...arguments)
    this.state = { selected: ['rainbow'] }
    this.func = new (Programs['rainbow'].func)()
  }
  handleClick(ev) {
    this.props.setCurrentProgram(ev.key)
    this.setState({ selected: [ev.key] })

    this.func.stop()
    this.func = new (Programs[ev.key].func)()
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
  }
  updateLeds(leds) {
    if (this.props.send) {
      this.props.send(leds)
    }
    if (this.refs.simulator) {
      this.refs.simulator.setTiles(leds)
    }
  }
  componentWillUnmount() {
    this.func.stop()
  }
  render() {
    var menuItems = [];
    for (var key in Programs){
      menuItems.push( <Menu.Item key={key}>{Programs[key].name}</Menu.Item>)
    }
    return (<div>
      <div>
        <h2>Simulator</h2>
        <h3>Current Program: { Programs[this.state.selected[0]].name } </h3>
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
