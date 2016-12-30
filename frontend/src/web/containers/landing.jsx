import * as React from 'react'

import { connect } from 'react-redux'
import { browserHistory } from 'react-router'
import { Menu, Item, Row, Col } from 'antd'
import { Link } from 'react-router'
import { default as styled } from 'styled-components'

const SubMenu = Menu.SubMenu
const MenuItemGroup = Menu.ItemGroup
const randomcolor = require('randomcolor')

const SimulatorContainer = styled.div`
  padding: 20px;
`

const EnableSimulatorContainer = styled.div`
  padding: 10px;
`

const EnableSimulatorCheckbox = styled.input`
`

const EnabledSimulatorLabel = styled.label`
  position: relative;
  top: -1px;
  left: 4px;
  font-size: 16px;
`

import { Func as blinkFunc, config as blinkConfig} from '../function/blink'
import { Func as rainbowFunc, config as rainbowConfig} from '../function/rainbow'
import { WSimulator } from './simulator'

const Programs = {
  'blink': {
    config: blinkConfig,
    func: blinkFunc,
    name: 'Blink'
  },
  'rainbow': {
    config: rainbowConfig,
    func: rainbowFunc,
    name: 'Rainbow'
  }
}

export class Simulator extends React.Component {
  constructor() {
    super(...arguments)
    this.state = { selected: ['blink'] }
    this.func = new (Programs['blink'].func)()
  }
  handleClick(ev) {
    this.props.setCurrentProgram(ev.key)
    this.setState({ selected: [ev.key] })

    this.func.stop()
    this.func = new (Programs[ev.key].func)()
    const self = this
    this.func.start({
      frequencyInHertz: 60,
      numberOfLeds: 150
    }, function(leds) {
      self.updateLeds(leds)
    }, () => ({}))
  }
  componentWillMount() {
    const self = this
    this.func.start({
      numberOfLeds: 150,
      frequencyInHertz: 10
    }, function(leds) {
      self.updateLeds(leds)
    }, () => ({}))
  }
  updateLeds(leds) {
    if (this.refs.simulator) {
      this.refs.simulator.setTiles(leds)
    }
  }
  componentWillUnmount() {
    this.func.stop()
  }
  render() {
    return (<div>
      <Row>
        <Col span={4}>
          <Menu onClick={this.handleClick.bind(this)} selectedKeys={this.state.selected}>
            <MenuItemGroup title='Programs' style={{ 'marginTop': '20px' }}>
              <Menu.Item key='blink'>Blink</Menu.Item>
              <Menu.Item key='rainbow'>Rainbow</Menu.Item>
            </MenuItemGroup>
          </Menu>
        </Col>
        <Col span={20}>
          <SimulatorContainer>
            <h2>Simulator</h2>
            <h3>Current Program: { Programs[this.state.selected[0]].name } </h3>
            { /*
            <EnableSimulatorContainer>
              <EnableSimulatorCheckbox type='checkbox' checked/>
              <EnabledSimulatorLabel>Enabled</EnabledSimulatorLabel>
            </EnableSimulatorContainer>
            */ }
            <WSimulator ref='simulator' />
          </SimulatorContainer>
        </Col>
      </Row>
    </div>)
  }
}

export default connect(state => state.program || {}, {
  setCurrentProgram: (dispatch) => (name) => ({
    type: 'set current program',
    name
  })
})(Simulator)