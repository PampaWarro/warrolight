import * as React from 'react'

export class Root extends React.Component {
  render() {
    return (<div>
      <a href="#">asda</a>
      { this.props.children }
    </div>)
  }
}