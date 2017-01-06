import * as React from 'react'

export class Root extends React.Component {
  render() {
    return (<div>
      { this.props.children }
    </div>)
  }
}