export interface Program {
    name: string
    config: { [name: string]: ConfigDefinition }
    presets: string[]
}

export type ConfigDefinition
    = { default: string, values: string[] }
    | { default: boolean }
    | { default: number, min: number, max: number, step: number }

export type ConfigValue = string | number | boolean

export interface Device {
    deviceId: string
    state: string
    lastFps: number
}

export interface MicConfig {
  sendingMicData: boolean
  metric: string
}

export interface MicSample {
  bass: number
  mid: number
  high: number
  all: number
}

export interface RemoteState {
  programs: Program[]
  currentProgramName: string
  currentConfig: { [name: string]: ConfigValue }
  micConfig: MicConfig
}
