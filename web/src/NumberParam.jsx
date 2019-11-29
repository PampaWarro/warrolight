/*global socket*/
import React from "react";

export class NumberParam extends React.Component {
    constructor(props) {
      super(props);
      this.field = props.field;
      this.min = (props.configDefinition || {}).min || 0;
      this.max = (props.configDefinition || {}).max || 100;
      this.step = (props.configDefinition || {}).step || 1;
      this.state = { value: props.val, configRef: props.configRef };
      this.handleChange = this.handleChange.bind(this);
      this.name = "" + Math.random();
    }
  
    handleChange(event) {
      this.setVal(event.target.value);
    }
  
    componentWillReceiveProps(nextProps) {
      this.setState({ value: nextProps.val, configRef: nextProps.configRef });
    }
  
    setVal(val) {
      let value = parseFloat(val);
      this.setState({ value: value, configRef: this.state.configRef });
      this.state.configRef[this.field] = value;
      console.log("PARAM CHANGE", this.state.configRef);
      socket.emit("updateConfigParam", this.state.configRef);
    }
  
    render() {
      return (
        <div className="config-item">
          <span>{this.field}:&nbsp;</span>
          <div>
            <strong>{this.state.value}&nbsp;</strong>
            <input
              type="range"
              name={this.name}
              min={this.min}
              step={this.step}
              max={this.max}
              value={this.state.value}
              onChange={this.handleChange}
            />
          </div>
        </div>
      );
    }
  }
  