import React from "react";

interface Props {
  name: string;
  value: number;
  min: number;
  step: number;
  max: number;
  onChange(name: string, value: number): void;
}

export class NumberParam extends React.Component<Props> {
  handleChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    let value = (event.target as any).valueAsNumber;
    this.props.onChange(this.props.name, value);
  };

  render() {
    return (
      <div className="config-item my-1 d-flex align-items-center">
        <div className="small" style={{width: '120px'}}>{this.props.name}</div>
        <div className="font-weight-bold text-right mr-2" style={{width: '40px'}}>{this.props.value}</div>
        <div style={{marginTop: '-8px'}} className={'flex-grow-1'}>
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
