import React from "react";
import _ from "lodash";

interface Props {
  name: string;
  value: string;
  options: string[];
  onChange(name: string, value: string): void;
}

export class StringParam extends React.Component<Props> {
  handleChange = (event: React.SyntheticEvent, value: string) => {
    event.preventDefault();
    this.props.onChange(this.props.name, value);
  };

  render() {
    return (
      <div className="config-item">
        <div className="overflow-auto">
          <div className="float-left">{this.props.name}&nbsp;</div>
          <div className="float-right font-weight-bold">{this.props.value}</div>
        </div>
        <div>
          <br />
          <div className="list-group">
            {_.map(this.props.options, v => (
              <button
                key={v}
                className={
                  "list-group-item list-group-item-action " +
                  (this.props.value === v ? "active" : "")
                }
                onClick={e => this.handleChange(e, v)}
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
