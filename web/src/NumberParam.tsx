import React from "react";

interface Props {
  name: string
  value: number
  min: number
  step: number
  max: number
  onChange(e: React.SyntheticEvent, name: string, value: number): void
}

export class NumberParam extends React.Component<Props> {
  
    handleChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
      let value = (event.target as any).valueAsNumber
      this.props.onChange(event, this.props.name, value);
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
  