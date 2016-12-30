import * as React from 'react'

import { Route, IndexRoute } from 'react-router'

import { Root } from './containers/root'

import { default as Simulator } from './containers/landing'

import { Settings } from './containers/settings'

export function routes() {
  return <Route path='/' component={Root}>
    <IndexRoute component={Simulator} />
    <Route path="/settings" component={Settings} />
  </Route>
}