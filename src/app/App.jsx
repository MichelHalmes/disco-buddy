import React from 'react';
import { connect } from 'react-redux';

import io from 'socket.io-client';
import { Modal } from 'semantic-ui-react';

import './App.css';



import { Points, Header, ModalInactivity } from './components.jsx';
import ModalSetUser from './containers/ModalSetUser';
import MessagePopup from './containers/MessagePopup';
import AudioPlayer from './containers/AudioPlayer';
import CodeArea from './containers/CodeArea';
import TweetMessage from './containers/TweetMessage';


const App = React.createClass({
  componentDidMount: function () {
    let self = this;
    self.props.getCode()

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


  //
  // recordActivity: function () {
  //   this.lastActivity = new Date().getTime();
  // },

  render() {
    return (
      <div className="ui center aligned basic segment no-margins" >
        <Header />
        <Points username={this.props.username} points={this.props.points} />
        <AudioPlayer onActivity={this.recordActivity} />
        <CodeArea />
        <TweetMessage />
        <ModalSetUser />
        <ModalInactivity isActive={this.props.isActive} onReactivate={this.props.reactivate} />
        <MessagePopup />
      </div>
    );
  }
});


const mapStateToProps = state => {
  return {
    points: state.pointsReducer,
    username: state.usernameReducer,
    isActive: state.activityReducer.isActive
  }
}

import { matchCodeSuccessAC, getCodeAC, reactivateAC} from './redux';

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    matchCodeSuccess: (matchUsername, points) => dispatch(matchCodeSuccessAC(matchUsername, points)),
    getCode: () => dispatch(getCodeAC()),
    reactivate: () => dispatch(reactivateAC())
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(App);
