import * as React from 'react'
import { Link, browserHistory } from 'react-router'
import { default as styled } from 'styled-components'

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
    return <h1>Hasdas</h1>
    // return (<MainWrapper>
    //   { this.props.children }
    // </MainWrapper>)
  }
}