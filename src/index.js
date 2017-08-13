import 'babel-polyfill'; // ES6 polyfill for browser comaptibility

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory } from 'react-router';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';

import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';


import App from './app/App.jsx';
import rootReducer from './app/redux';
import Monitor from './monitor/Monitor.jsx';

const loggerMiddleware = createLogger()

let store = createStore(
  rootReducer,
  applyMiddleware(
    thunkMiddleware, // lets us dispatch() functions
    loggerMiddleware // neat middleware that logs actions
  )
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
