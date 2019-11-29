import React from "react";
import _ from "lodash";
import { StringParam } from "./StringParam";
import { BooleanParam } from "./BooleanParam";
import { NumberParam } from "./NumberParam";

export class ProgramConfig extends React.Component {

  handleRestartProgram(e) {
    e.preventDefault();
    this.props.onRestartProgram();
  }

  render() {
    const currentProgram = this.props.program;

    if (!currentProgram) {
      return null;
    }

    let configOptions = [];
    let presets = [];

    for (let paramName in currentProgram.config) {
      let val = this.props.config[paramName];
      if (_.isBoolean(currentProgram.config[paramName].default)) {
        configOptions.push(
          <BooleanParam
            key={paramName}
            configDefinition={currentProgram.config[paramName]}
            configRef={this.props.config}
            val={val}
            field={paramName}
          />
        );
      } else if (_.isString(currentProgram.config[paramName].default)) {
        configOptions.push(
          <StringParam
            key={paramName}
            configDefinition={currentProgram.config[paramName]}
            configRef={this.props.config}
            val={val}
            field={paramName}
          />
        );
      } else {
        configOptions.push(
          <NumberParam
            key={paramName}
            configDefinition={currentProgram.config[paramName]}
            configRef={this.props.config}
            val={val}
            field={paramName}
          />
        );
      }
    }

    const programPresets = currentProgram.presets ? currentProgram.presets : []

    for (let preset of programPresets) {
      presets.push(
        <a
          className="btn btn-sm btn-outline-success mr-1 mb-1"
          href="#"
          key={preset}
          onClick={e => this.props.onSelectPreset(preset)}
        >
          {preset}
        </a>
      );
    }

    return (
      <div>
        <h4 className="pt-2">
          {currentProgram.name} &nbsp;
          <a href="#" className="btn btn-sm btn-outline-secondary" onClick={this.handleRestartProgram.bind(this)}>
            Restart
          </a>
        </h4>
        {presets.length > 0 ? <hr /> : null}
        <div>{presets}</div>
        <hr/>
        <div>{configOptions}</div>
      </div>
    )

  }
}
