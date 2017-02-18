import * as React from 'react'
import { connect } from 'react-redux'

class Item extends React.Component {
  render() {
    return <a href="#" onClick={this.props.onClick}>{this.props.children}</a>
  }
}

export class DjDashboard extends React.Component {
  constructor() {
    super(...arguments)

    this.state = {
      actions: {"off": "APAGAR LUCES", "warro": "Logo Pampa Warro"}
    }

    this.leds = []
  }

  handleProgramClick(djAction, ev) {
    ev.preventDefault()
    this.props.send(djAction)
  }

  render() {
    let menuItems = [];
    for (let actionKey in this.state.actions){
      menuItems.push( <Item key={actionKey} className="selected" onClick={e => this.handleProgramClick(actionKey, e)}>{this.state.actions[actionKey]}</Item>)
    }

    {
      return (
        <div>
        <div className="contain">
          <div className="controls">
            <div>
              <h2>Pampa Warro</h2>
            </div>
            <div className="menuItems">{ menuItems }</div>
          </div>
        </div>
      </div>)
    }
  }
}

export default connect(state => state.program || {}, {
  send: (action) => ({
    type: "send",
    msgType: "dj-action",
    payload: action
  })
})(DjDashboard)
