/*global socket*/
import React from "react";

export class BooleanParam extends React.Component {
    constructor(props) {
      super(props);
      this.field = props.field;
      this.state = { value: props.val, configRef: props.configRef };
      this.handleChange = this.handleChange.bind(this);
      this.name = "" + Math.random();
    }
  
    handleChange(event) {
      this.setVal(event.target.checked);
    }
  
    componentWillReceiveProps(nextProps) {
      this.setState({ value: nextProps.val, configRef: nextProps.configRef });
    }
  
    setVal(value) {
      this.setState(state => {
        state.configRef[this.field] = value;
        return { configRef: state.configRef, value };
      });
      console.log("BOOL PARAM CHANGE", this.state.configRef);
      socket.emit("updateConfigParam", this.state.configRef);
    }
  
    render() {
      return (
        <div className="config-item my-3">
            <div className="overflow-auto">
                <div className="float-left">{this.field}&nbsp;</div>
                <input
                    className="float-right"
                    type="checkbox"
                    name={this.name}
                    checked={this.state.value}
                    onChange={this.handleChange}
                />
            </div>
        </div>
      );
    }
  }
  