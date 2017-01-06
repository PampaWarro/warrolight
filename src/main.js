// Rendering
import * as React from "react";
import * as ReactDOM from "react-dom";
import {Provider} from "react-redux";
import RedBox from "redbox-react";

// Routing
import {Router, browserHistory} from "react-router";

// Hot reloading
import {AppContainer} from "react-hot-loader";

// My redux config
import {configureStore} from "./store";

// Get routes
import {routes} from "./routes";

// Instantiation
const store = configureStore();

function drawApp(getRoutes) {
  try {
    ReactDOM.render(
      <Provider store={store}>
        <Router history={browserHistory}>
          { getRoutes() }
        </Router>
      </Provider>,
      document.getElementById('app')
    )
  } catch (e) {
    ReactDOM.render(<RedBox error={e} />, document.getElementById('app'))
  }
}

// Finally, draw!
drawApp(routes)

if (module.hot) {
  module.hot.accept('./routes', () => {
    const routes = require('./routes').routes
    drawApp(routes)
  })
}
