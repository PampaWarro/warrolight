import React from "react";

export class ProgramList extends React.Component {
    render() {
      let menuItems = [];
      for (let key in this.props.programs) {
        if (key === this.props.selected) {
          menuItems.push(
            <Item key={key} selected>
              {this.props.programs[key].name}
            </Item>
          );
        } else {
          menuItems.push(
            <Item key={key} onClick={() => this.props.onProgramChange(key)}>
              {this.props.programs[key].name}
            </Item>
          );
        }
      }
  
      return (
        <ul className="nav flex-column">
          {menuItems}
        </ul>
      )
    }
}

class Item extends React.Component {
    render() {
      return (
        <li className="nav-item">
          <a href="#" className={"nav-link " + (this.props.selected ? "active" : "")} onClick={this.props.onClick}>
            {this.props.children}
          </a>
        </li>
      );
    }
}
