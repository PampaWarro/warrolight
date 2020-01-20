export interface Program {
  name: string;
  config: { [name: string]: ConfigDefinition };
  presets: string[];
}

export type ConfigDefinition =
  | { type: string, default: string; values: string[] }
  | { type: string, default: boolean }
  | { type: string, default: number; min: number; max: number; step: number };

export type ConfigValue = string | number | boolean;

export interface Device {
  deviceId: string;
  status: string;
  lastFps: number;
}

export interface MicConfig {
  sendingMicData: boolean;
  metric: string;
}

export interface MicSample {
  bass: number;
  mid: number;
  high: number;
  all: number;
}

export interface RemoteState {
  programs: Program[];
  currentProgramName: string;
  currentConfig: { [name: string]: ConfigValue };
  globalConfig: { [name: string]: any };
  micConfig: MicConfig;
}

// TODO: fill complete layout object, also decide if we need to use all of it
export interface RemoteLayout {
  geometry: { x: number[]; y: number[], z: number[] };
}
