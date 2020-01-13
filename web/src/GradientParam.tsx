import React from "react";
import _ from "lodash";

interface Props {
  name: string;
  value: string;
  options: string[];
  onChange(e: React.SyntheticEvent, name: string, value: string): void;
}

export class GradientParam extends React.Component<Props> {
  handleChange = (event: React.SyntheticEvent, value: string) => {
    event.preventDefault();
    this.props.onChange(event, this.props.name, value);
  };

  render() {
    const {value, options} = this.props;

    return (
      <div className="config-item">
        <div className="">
          <div className="float-left">{this.props.name}&nbsp;</div>

          <div className="float-right font-weight-bold">
            <div className="dropdown">
              <button className="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
                      data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" aria-boundary={"window"}>
                {value} <span className={`gradient-tas mr-2 d-inline-block`} style={{backgroundImage: `url("/images/gradientlib/${value}.png")`}}>&nbsp;</span>
              </button>
              <div className="dropdown-menu gradient-dropdown" aria-labelledby="dropdownMenuButton">
                <button key={'none'} className={`small dropdown-item ${!value ? "active" : ""}`}
                        onClick={e => this.handleChange(e, '')}>
                  None
                </button>

                {_.map(options, v => (
                  <button
                    key={v}
                    className={`small dropdown-item ${value === v ? "active" : ""}`}
                    onClick={e => this.handleChange(e, v)}
                  >
                    {v}
                    <span className={`gradient-tas ml-2 d-inline-block w-75`}
                          style={{backgroundImage: `url("/images/gradientlib/${v}.png")`}}>&nbsp;</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
