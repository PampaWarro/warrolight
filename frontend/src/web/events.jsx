import { default as SocketIO } from 'socket.io-client'
import { update } from './common'

export const Connected = 'Socket connected'
export const Disconnected = 'Socket disconnected'

function insertToSet(set, element) {
  if (set.indexOf(element) === -1) {
    return Array.prototype.concat.call([], set, [element])
  }
  return set
}

export function connectionReducer(store, action) {
  switch (action.type) {
    case Connected:
      return update(store, { connected: true })
    case Disconnected:
      return update(store, { connected: false })
    default:
      break
  }
  return store || {}
}

export function connectStoreToEvents(store) {
  const io = SocketIO()
  io.on('connect', () => {
    store.dispatch({ type: Connected })
  })
  io.on('disconnect', () => {
    store.dispatch({ type: Disconnected })
  })
  return store
}
