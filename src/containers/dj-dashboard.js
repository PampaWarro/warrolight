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

    this.state = {}
    // this.props = { actions: {}}
  }

  handleProgramClick(djAction, ev) {
    ev.preventDefault()
    this.props.send(djAction)
  }

  render() {
    let menuItems = [];
    for (let actionKey in this.props.actions){
      if(actionKey !== "resume" || this.props.serverState == "dj-action")
        menuItems.push( <Item key={actionKey} className="selected" onClick={e => this.handleProgramClick(actionKey, e)}>{this.props.actions[actionKey]}</Item>)
    }

    let state = "Desconectado del server";
    let stateClass = "state-danger"
    if(this.props.connected){
      state = this.props.serverState || "Connected";
      stateClass = "state-ok"

      if(state == "dj-action" && this.props.stateTimeRemaining){
        state += ` (quedan ${(this.props.stateTimeRemaining/1000).toFixed(1)}s)`
      }
    }

    {
      return (
        <div>
        <div className="contain">
          <div className="dj-dash controls">
            <div>
              <h2>Pampa Warro DJ</h2>
            </div>
            <div className={"state "+stateClass}>{ state }</div>
            <div className="menuItems">{ menuItems }</div>
          </div>
        </div>
      </div>)
    }
  }
}

let mapStateToProps = state => {
  console.log("STATE CHANGE", state)

  return {
    connected: state.connection.connected,
    serverState: state.connection.state,
    actions: state.connection.actions || {},
    stateTimeRemaining: state.connection.stateTimeRemaining || null
  }
}

export default connect(mapStateToProps, {
  send: (action) => ({
    type: "send",
    msgType: "dj-action",
    payload: action
  })
})(DjDashboard)
