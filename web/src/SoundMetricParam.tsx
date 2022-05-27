import React from "react";
import { StringParam } from "./StringParam";

const metrics = [
  'rms', 'fastPeakDecay', 'peakDecay',
  'bassRms', 'bassFastPeakDecay', 'bassPeakDecay',
  'midRms', 'midFastPeakDecay', 'midPeakDecay',
  'highRms', 'highFastPeakDecay', 'highPeakDecay'
];

// @ts-ignore
export function SoundMetricParam({ onChange, name, value }) {
  let [, mic, baseMetric] = (value || '').match(/^(mic\d+_)?(.*)$/);

  return <div className={'d-flex'}>
    <div className={'flex-grow-1'}>
      <StringParam
        name={name}
        value={baseMetric}
        options={metrics}
        onChange={(name, sel) => onChange(name, (mic|| '')+sel)}/>
    </div>
    <div className={'ml-2'}>
        <span className={'btn btn-sm btn-' + (mic ? 'outline-secondary' : 'primary')}
              onClick={() => onChange(name, baseMetric)}>
          A
        </span>
      <span className={'btn btn-sm btn-' + (mic == 'mic2_' ? 'warning' : 'outline-secondary')}
            onClick={() => onChange(name, 'mic2_'+baseMetric)}>
          B
        </span>
    </div>
  </div>;
}
