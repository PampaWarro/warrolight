export interface Program {
  name: string;
  config: { [name: string]: ConfigDefinition };
  presets: string[];
}

export type ConfigDefinition =
  | { type: string, default: string; values: string[] }
  | { type: string, default: boolean }
  | { type: string, default: number; min: number; max: number; step: number };

export type ConfigValue = any;

export type CurrentProgramParameters = {
  defaults?: { [param: string]: ConfigValue },
  presetOverrides?: { [param: string]: ConfigValue },
  overrides?: { [param: string]: ConfigValue }
  currentPreset?: string | null
}

export interface Device {
  metadata: any;
  deviceId: string;
  status: string;
  lastFps: number;
}

export interface MicConfig {
  sendingMicData: boolean;
  metric: string;
  input: string;
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
