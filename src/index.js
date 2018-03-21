import 'babel-polyfill'; // ES6 polyfill for browser comaptibility

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory } from 'react-router';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';

import App from './app/App.jsx';
import rootReducer from './app/redux';
import Monitor from './monitor/Monitor.jsx';

import thunkMiddleware from 'redux-thunk'; // lets us dispatch() functions

let middleware = [thunkMiddleware]
if (process.env.NODE_ENV !== 'production') {
  let loggerMiddleware = require('redux-logger').createLogger() // neat middleware that logs actions
  middleware = [...middleware, loggerMiddleware]
}

let store = createStore(
  rootReducer,
  applyMiddleware(...middleware)
)

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory}>
      <Route path="/" component={App} />
      <Route path="/monitor" component={Monitor} />
    </Router>
  </Provider>
  , document.getElementById('root')
);
