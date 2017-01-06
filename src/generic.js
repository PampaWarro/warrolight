import { update } from './common'

const MARK_LOADING = 'mark loading '
const SET_RESULT = 'set result '
const ERRORED = 'errored  '

export function updateLeave(root, path, updateValue) {
  return update(root, { [path]: updateValue })
}

const IGNORE_INITIAL_SPACE_FOR_ALL_ACTION_TYPES = 6
function findPath(str) {
  return str.slice(str.indexOf(' ', IGNORE_INITIAL_SPACE_FOR_ALL_ACTION_TYPES) + 1)
}

const types = [MARK_LOADING, SET_RESULT, ERRORED]

function getActionType(str) {
  for (let type of types) {
    if (str.indexOf(type) === 0) {
      return type
    }
  }
}

export default function(store, action) {
  let newValue
  const match = getActionType(action.type)
  switch(match) {
    case MARK_LOADING:
      newValue = { loading: true }
      break
    case SET_RESULT:
      newValue = { loading: false, result: action.payload }
      break
    case ERRORED:
      newValue = { loading: false, error: action.payload }
      break
    default:
      return store || {}
  }
  const leavePath = findPath(action.type)
  return updateLeave(store, leavePath, newValue)
}