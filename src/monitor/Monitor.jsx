import React from 'react';
import Client from './client.js';

import io from 'socket.io-client';


import { Modal, Popup, Grid} from 'semantic-ui-react'


const Monitor = React.createClass({

  render() {
    return (
      <div className="ui center aligned basic segment" >
        <h1>Hellowwww!!!</h1>
        <p>This is a second route</p>

      </div>
    );
  }
});

export default Monitor;
