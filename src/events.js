import { default as SocketIO } from 'socket.io-client'
import { update } from './common'

export const Connected = 'Socket connected'
export const Disconnected = 'Socket disconnected'
export const ServerData = 'Server data'
export const RemoteCmd = 'Remote cmd'

// Negrada para no fijat el host y cambiar el puerto
export const io = SocketIO(window.location.host.replace("3001", "3000"))

export function connectionReducer(store, action) {
  switch (action.type) {
    case Connected:
      return update(store, { connected: true })
    case Disconnected:
      return update(store, { connected: false })
    case ServerData:
      if(action.payload) {
        return update(store, action.payload)
      }
      break
    case RemoteCmd:
      if(action.payload) {
        return update(store, {remoteCmd: action.payload})
      }
      break
    default:
      break
  }
  return store || {}
}

export function connectStoreToEvents(store) {
  io.on('connect', () => {
    store.dispatch({ type: Connected })
  })
  io.on('disconnect', () => {
    store.dispatch({ type: Disconnected })
  })
  io.on('data', (data) => {
    store.dispatch({ type: ServerData, payload: data })
  })
  io.on('cmd', (data) => {
    store.dispatch({ type: RemoteCmd, payload: data })
  })
  return store
}
