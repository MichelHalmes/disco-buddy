import React from 'react';
import { connect } from 'react-redux';

import io from 'socket.io-client';
import { Modal } from 'semantic-ui-react';

import './App.css';
import CONFIG from '../../config.js';


import { Points, Header, ModalInactivity } from './Components.jsx';
import ModalSetUser from './containers/ModalSetUser';
import MessagePopup from './containers/MessagePopup';
import AudioPlayer from './containers/AudioPlayer';
import CodeArea from './containers/CodeArea';
import TweetMessage from './containers/TweetMessage';


const App = React.createClass({
  getInitialState: function () {
    // let username = JSON.parse(localStorage.getItem('username'));
    this.lastActivity = new Date().getTime();
    this.resolveInactivity;

    return {code: undefined,
      isInactive: false
    };
  },

  componentDidMount: function () {
    let self = this;
    this.props.getCode()

    self.socket = io();
    self.socket.on('connect', () => self.socket.emit('send:username', self.props.username));

    self.socket.on('code:match', function ({username, matchUsername, points}) {
      if (username!== self.props.username) throw new Error('Codematch for another user: ' + username);
      self.props.matchCodeSuccess(matchUsername, points)
    });
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (this.props.username && prevProps.username !== this.props.username) {
      this.socket.emit('send:username', this.props.username);
    }
  },


  handleReactivate: function () {
    this.resolveInactivity();
    this.recordActivity();
    this.setState({isInactive: false});
  },

  recordActivity: function () {
    this.lastActivity = new Date().getTime();
  },

  render() {
    return (
      <div className="ui center aligned basic segment no-margins" >
        <Header />
        <Points username={this.props.username} points={this.props.points}/>
        <AudioPlayer onActivity={this.recordActivity} />
        <CodeArea onActivity={this.recordActivity}/>
        <TweetMessage onActivity={this.recordActivity}/>
        <ModalSetUser  />
        <ModalInactivity isInactive={this.state.isInactive} onReactivate={this.handleReactivate} />
        <MessagePopup  />
      </div>
    );
  }
});


const mapStateToProps = state => {
  return {
    points: state.pointsReducer,
    username: state.usernameReducer,
    code: state.codeReducer.code,
    matchedCurrentCode: state.codeReducer.matchedCurrentCode,
  }
}

import { updatePointsAC, matchCodeSuccessAC, getCodeAC } from './redux';

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    updatePoints: (points) => dispatch(updatePointsAC(points)),
    matchCodeSuccess: (matchUsername, points) => dispatch(matchCodeSuccessAC(matchUsername, points)),
    getCode:() => dispatch(getCodeAC()),
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(App);
