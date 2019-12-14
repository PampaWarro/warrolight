import React from "react";

interface Props {
  name: string;
  value: boolean;
  onChange(e: React.SyntheticEvent, name: string, value: boolean): void;
}
export class BooleanParam extends React.Component<Props> {
  handleChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    let value = (event.target as any).checked as boolean;
    this.props.onChange(event, this.props.name, value);
  };

  render() {
    return (
      <div className="config-item my-1">
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