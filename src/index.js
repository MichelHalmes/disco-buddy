import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, browserHistory} from 'react-router';

import App from './app/App.jsx';
import Monitor from './monitor/Monitor.jsx';

ReactDOM.render(
  <Router history={browserHistory}>
    <Route path="/" component={App} />
    <Route path="/monitor" component={Monitor} />
  </Router>,
  document.getElementById('root')
);
