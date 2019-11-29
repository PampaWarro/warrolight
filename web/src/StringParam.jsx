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
  
    handleChange(e, val) {
      e.preventDefault()
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
          <div className="overflow-auto">
              <div className="float-left">{this.field}&nbsp;</div>
              <div className="float-right font-weight-bold">{this.state.value}</div>
          </div>
          <div>
            <br />
            <div className="list-group">
              {_.map(this.values, v => (
                <a
                  href="#"
                  key={v}
                  className={"list-group-item list-group-item-action " + (this.state.value === v ? "active" : "")}
                  onClick={(e) => this.handleChange(e, v)}
                >
                  {v}
                </a>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }
  