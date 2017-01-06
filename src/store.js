import {createStore, combineReducers, compose, applyMiddleware} from "redux";
import createSagaMiddleware from "redux-saga";
import {routerReducer} from "react-router-redux";

import {connectionReducer, connectStoreToEvents} from "./events";
import {default as mainSaga} from "./saga";

export function configureStore() {
  const saga = createSagaMiddleware()
  const store = createStore(combineReducers({
      routing: routerReducer,
      connection: connectionReducer,
    }),
    compose(
      applyMiddleware(saga),
      window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : (e) => e
    )
  )
    console.log('state', store.getState())

  saga.run(mainSaga)

  connectStoreToEvents(store)

  return store
}