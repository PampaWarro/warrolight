import React from "react";

export class BooleanParam extends React.Component {
  
    handleChange = (event) => {
      this.props.onChange(event, this.props.name, event.target.checked)
    }
  
    render() {
      return (
        <div className="config-item my-3">
            <div className="overflow-auto">
                <div className="float-left">{this.props.name}</div>
                <input
                    className="float-right"
                    type="checkbox"
                    name={this.props.name}
                    checked={this.props.value}
                    onChange={this.handleChange}
                />
            </div>
        </div>
      );
    }
  }
  