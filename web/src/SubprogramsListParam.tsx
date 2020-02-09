import React from "react";
import _ from "lodash";
import { ConfigValue } from "./types";
import { SubprogramParam } from "./SubprogramParam";

interface Props {
  name: string;
  value: any;
  options: any;
  globalConfig: { [param: string]: any };
  onChange(name: string, value: ConfigValue): void;
}

export class SubprogramsListParam extends React.Component<Props, any> {
  constructor(props: Props) {
    super(props)
    this.state = {
      collapsed: true
    }
  }

  handleSubprogramChange(subProgramKey: string, name: string, value: ConfigValue) {
    const changedConfig = [...this.props.value];
    // @ts-ignore
    changedConfig[subProgramKey] = value;

    this.props.onChange(this.props.name, changedConfig);
  }

  addSubprogram() {
    const newProgramConfig = { programName: 'stars' };

    this.props.onChange(this.props.name, [...this.props.value, newProgramConfig]);
  }

  removeSubprogram(programKey: String) {
    const changedConfig = [...this.props.value];
    changedConfig.splice(Number(programKey), 1)
    this.props.onChange(this.props.name, changedConfig);
  }

  render() {
    const { name, value, options, globalConfig } = this.props;

    const subprogramsConfig = value || [];

    const subprograms = _.map(subprogramsConfig, (subprogramConfig, index) => {
      return <div className={'mb-2'} key={index}>
        <SubprogramParam
          name={`#${index + 1}`}
          value={subprogramConfig}
          globalConfig={globalConfig}
          includeShapeParameter={true}
          options={options}
          onChange={(name, config) => this.handleSubprogramChange(index, name, config)}
          onRemoveProgram={() => this.removeSubprogram(index)}
        />
      </div>;
    })

    return (
      <div className="config-item">
        <div className="">
          <div>
            {name}
          </div>
        </div>
        <div>
          {subprograms}
          <span className={'btn btn-sm btn-success'} onClick={() => this.addSubprogram()}>
            Add subprogram
          </span>
        </div>
      </div>
    );
  }
}
