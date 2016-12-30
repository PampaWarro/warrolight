import * as React from 'react'

import { Menu, Icon, Anchor } from 'antd'
import { Link, browserHistory } from 'react-router'

import { default as styled } from 'styled-components'

const SubMenu = Menu.SubMenu

const MainWrapper = styled.div`
  font-size: 14px;
`

export class Settings extends React.Component {
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
      <h2>Settings</h2>
    </MainWrapper>)
  }
}