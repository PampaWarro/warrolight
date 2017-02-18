import { default as SocketIO } from 'socket.io-client'
import { update } from './common'

export const Connected = 'Socket connected'
export const Disconnected = 'Socket disconnected'
export const ServerData = 'Server data'

export const io = SocketIO('localhost:3000')

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
  return store
}
