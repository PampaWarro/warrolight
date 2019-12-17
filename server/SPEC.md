warrolight server specification
===============================

The warrolight server works over WebSocket connections. The WebSocket client specifies the subprotocol `warro` when connecting. The server must respond with a `Sec-Websocket-Protocol` header indicating it supports that subprotocol.

## Message encoding

All messages sent and received by the server are of type UTF-8 and contain a JSON-encoded payload with the structure `[type, data]`, where `type` MUST be a string and `data` can be any arbitrary JSON object or atomic value.

## Message types

### Client messages

#### `startSamplingLights`

Sent when client wants to start receiving `lightsSample` messages from the server. `data` is ignored.

#### `stopSamplingLights`

Sent when client wants to stop receiving `lightsSample` messages from the server. `data` is ignored.

#### `setCurrentProgram`

Sent when client wants to change the current light program. `data` MUST be a string with the name of the new program.

#### `setPreset`

Sent when client wants to change the preset for the current light program. `data` MUST be a string with the name of the new preset. If a preset with that name is not found, the message SHOULD be ignored.

#### `setMicDataConfig`

Sent when the client wants to change the configuration for the real-time microphone output configuration. `data` MUST be an object with the shape `{ sendingMicData: bool, metric: string }`. Supported metrics are "Rms", "PeakDecay" and "FastPeakDecay". The server MUST acknowledge this message with a `stateChange` message containing the updated mic config.

#### `updateConfigParam`

Sent when the client wants to change a parameter for the configuration of the current light program. `data` MUST be an object containing all the configuration parameters with their updated value in the new configuration. The server MUST acknowledge this message with a `stateChange` message containing the updated config for the currently running program.

#### `restartProgram`

Sent when the client wants to restart the currently running program.

### Server messages

#### `completeState`

Sent from the server immediately after a new client connects to provide it with the current values for several important configurations. `data` must be an object with the following type:

```
{
  "programs": [
      {
          "name": string,
          "config": object,
          "presets": string[]
      }
  ],
  "currentProgramName": string,
  "currentConfig": object,
  "micConfig": {
      "sendingMicData": boolean,
      "metric": string
  }
}
```

#### `stateChange`

Sent whenever the config for the current program or mic changes. `data` MUST be an object of type:

```
{
  "currentProgramName": string,
  "currentConfig": object,
  "micConfig": {
      "sendingMicData": boolean,
      "metric": string
  }
}
```

#### `lightsSample`

Sent on each light program tick with the latest values for all the lights, to show in the lights preview. The sending of `lightsSample` messages is controlled via the `startSamplingLights` and `stopSamplingLights` messages. `data` will contain a base64-encoded binary string containing 3 x number of lights bytes. Each chunk of 3 bytes contains the RGB components of the light at that index, where the geometry of where that index is positioned comes from the `layout` message.

#### `layout`

Sent as first message when server receives a `startSamplingLights` message. `data` must be an object of type:

```
{
    "numberOfLights": number,
    "geometry": {
        "leds": number,
        "x": number[],
        "y": number[]
    }
}
```

Where the `x` and `y` arrays contain the horizontal and vertical components of each LED light. The client is encouraged to rescale and center the lights display as suitable.
