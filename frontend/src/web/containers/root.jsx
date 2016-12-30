import * as React from 'react'

import { Menu, Icon, Anchor } from 'antd'
import { Link, browserHistory } from 'react-router'

import { default as styled } from 'styled-components'

const SubMenu = Menu.SubMenu

const MainWrapper = styled.div`
  font-size: 14px;
`

export class Root extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = { selected: 'landing' }
  }

  select({ key }) {
    browserHistory.push('/' + (key === 'landing' ? '' : key))
    this.setState({ selected: key })
  }

  render() {
    return (<MainWrapper>
      <Menu mode='horizontal' selectedKeys={['simulator']}>
        <Menu.Item key='simulator'>
          <Link to='/'><Icon type="laptop" /> Simulator</Link>
        </Menu.Item>
        <Menu.Item key='settings'>
          <Link to="/settings"><Icon type="setting" /> Settings</Link>
        </Menu.Item>
      </Menu>
      { this.props.children }
    </MainWrapper>)
  }
}