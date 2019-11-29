/*global socket*/
import React from "react";
import _ from "lodash";

export class StringParam extends React.Component {
    constructor(props) {
      super(props);
      this.field = props.field;
      this.state = { value: props.val, configRef: props.configRef };
      this.values = (props.configDefinition || {}).values || "MAL DEFINIDO";
      this.handleChange = this.handleChange.bind(this);
      this.name = "" + Math.random();
    }
  
    handleChange(val) {
      this.setVal(val);
    }
  
    componentWillReceiveProps(nextProps) {
      this.setState({ value: nextProps.val, configRef: nextProps.configRef });
    }
  
    setVal(val) {
      let value = val;
      this.state.configRef[this.field] = value;
      this.setState({ value: value });
      console.log("STRING PARAM CHANGE", this.state.configRef);
      socket.emit("updateConfigParam", this.state.configRef);
    }
  
    render() {
      return (
        <div className="config-item">
          <span>{this.field}:&nbsp;</span>
          <div>
            <strong>{this.state.value}&nbsp;</strong>
            <br />
            <div style={{ zoom: "0.8" }}>
              {_.map(this.values, v => (
                <button
                  key={v}
                  className={this.state.value === v ? "selected" : ""}
                  onClick={() => this.handleChange(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }
  