import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, browserHistory} from 'react-router';
import {Provider} from 'react-redux'
import {createStore} from 'redux'

import App from './app/App.jsx';
import appReducer from './app/redux';
import Monitor from './monitor/Monitor.jsx';

let store = createStore(appReducer)

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory}>
      <Route path="/" component={App} />
      <Route path="/monitor" component={Monitor} />
    </Router>
  </Provider>
  , document.getElementById('root')
);
