// @ts-nocheck
import React from "react";
import Creatable, { ActionMeta, MultiValue } from 'react-select/creatable';
import _ from "lodash";

interface Props {
  name: string;
  value: string[];
  options: string[];
  onChange(name: string, value: string[]): void;
}

let customStyles = {
  control: (defaultStyle) => ({
    ...defaultStyle,
    background: 'transparent',
    borderColor: 'dark-gray'
  })
};

// UI sugar
const predefinedLabels = {
  "bright": "🔆 bright",
  "dark": "🌑 dark",
}

const makeOption = v => ({ value: v, label: predefinedLabels[v] || v });

// UX patch: In memory cache of all the used tags so that at least you don´t have to write twice the same tag
// in the same browser pageview. Ideally this data should come from the server and all presets
let globalAllOptions = [];

export class TagsParam extends React.Component<Props> {
  handleChange = (newValue: MultiValue<{ value: string, label: string }>, actionMeta: ActionMeta<string>) => {
    let values = Array.from(newValue.values()).map(o => o.value);

    // Update global cache of used tags
    globalAllOptions = _.uniq(globalAllOptions.concat(values));

    this.props.onChange(this.props.name, values.length ? values : null);
  };

  render() {
    const { name, value, options } = this.props;

    let possibleOptions = _.uniq(options.concat(globalAllOptions)).map(makeOption);

    return (
      <div className="config-item d-flex justify-content-between align-items-center">
        <div className="small" style={{width: '120px'}}>{name}&nbsp;</div>
        <div className="flex-grow-1 text-dark" style={{ zoom: "0.8" }}>
          <Creatable
            value={(value || []).map(makeOption)}
            isMulti={true}
            styles={customStyles}
            onChange={this.handleChange}
            options={possibleOptions}
          />
        </div>
      </div>
    );
  }
}
