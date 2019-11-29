import React from "react";

export class NumberParam extends React.Component {
  
    handleChange = (event) => {
      this.props.onChange(event, this.props.name, event.target.valueAsNumber);
    }
  
    render() {
      return (
        <div className="config-item my-3">
          <div className="overflow-auto">
            <div className="float-left">{this.props.name}</div>
            <div className="float-right font-weight-bold">{this.props.value}</div>
          </div>
          <div>
            <input
              type="range"
              min={this.props.min}
              step={this.props.step}
              max={this.props.max}
              value={this.props.value}
              onChange={this.handleChange}
            />
          </div>
        </div>
      );
    }
  }
  