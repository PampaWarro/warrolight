import React from "react";

interface Props {
  name: string;
  value: boolean;

  onChange(name: string, value: boolean): void;
}

export class BooleanParam extends React.Component<Props> {
  render() {
    const { onChange, name, value } = this.props;

    const toggle = () => onChange(name, !value);

    return (
      <span className="inline-block mb-1 mr-1">
        <span className={`btn btn-sm p-1 btn-${value ? 'success' : 'outline-secondary'}`} onClick={toggle}>
          {value ? '✅' : '🔲'} {name}
        </span>
      </span>
    );
  }
}
