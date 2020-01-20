import React from "react";
import _ from "lodash";

interface Props {
  name: string;
  value: string;
  options: { [key: string]: string };
  onChange(e: React.SyntheticEvent, name: string, value: string): void;
}

export class GradientParam extends React.Component<Props> {
  handleChange = (event: React.SyntheticEvent, value: string) => {
    event.preventDefault();
    this.props.onChange(event, this.props.name, value);
  };

  render() {
    const {value, options} = this.props;

    let gradientCss = (stops: string) => ({background: `linear-gradient(to right, ${stops})`})

    let stops = options[value];
    let name = value;
    if(value) {
      name = stops ? value : 'custom-gradient';
      // Assume value was a string with css stops
      stops = stops || value;
    } else {
      stops = "#00000000,#00000000"
      name = "None"
    }

    return (
      <div className="config-item">
        <div className="">
          <div className="float-left">{this.props.name}&nbsp;</div>

          <div className="float-right font-weight-bold">
            <div className="dropdown">
              <button className="btn btn-sm btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
                      data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" aria-boundary={"window"}>
                {name} <span className={`gradient-tas mr-2 d-inline-block`} style={gradientCss(stops)}>&nbsp;</span>
              </button>
              <div className="dropdown-menu gradient-dropdown" aria-labelledby="dropdownMenuButton">

                <button key={'none'} className={`small dropdown-item ${!value ? "active" : ""}`}
                        onClick={e => this.handleChange(e, '')}>
                  None
                </button>

                {_.map(_.toPairs(options).sort(), ([gradientName,gradientStops]) => (
                  <button
                    key={gradientName}
                    className={`small dropdown-item ${gradientName === value ? "active" : ""}`}
                    onClick={e => this.handleChange(e, gradientName)}
                  >
                    <span className={`gradient-tas mr-2 d-inline-block w-100`} title={gradientName}
                          style={gradientCss(gradientStops)}>&nbsp;</span>

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
