import {call, put} from "redux-saga/effects";
import {takeEvery} from "redux-saga";
import {io} from "./events";

function apiFetch(url) {
  return fetch('/api/' + url)
    .then(r => r.json())
}

function* fetchData(action) {
  const title = action.payload

  yield put({ type: 'mark loading ' + title })
  try {
    const body = yield call(apiFetch, title)
    yield put({ type: 'set result ' + title, payload: body })
  } catch (error) {
    yield put({ type: 'errored ' + title, payload: error })
  }
}

function* socketSend(action) {
  io.send({
    action: action.msgType,
    payload: action.payload
  })
}
function* clearRemote(action) {
  yield put({ type: 'Clear remote' })
}

export default function* watchForGenericCalls() {
  yield takeEvery('API_FETCH_REQUEST', fetchData)
  yield takeEvery('Remote cmd', clearRemote)
  yield takeEvery('send', socketSend)
}