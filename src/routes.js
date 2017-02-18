import * as React from 'react'
import { Route, IndexRoute } from 'react-router'

import { Root } from './containers/root'
import { default as Simulator } from './containers/main'
import { default as Geometry } from './geometry/canvas'
import { default as DjDashboard} from "./containers/dj-dashboard";

export function routes() {
  return <Route path='/' component={Root}>
    <IndexRoute component={Simulator} />
    <Route path='dj' component={DjDashboard} />
  </Route>
}