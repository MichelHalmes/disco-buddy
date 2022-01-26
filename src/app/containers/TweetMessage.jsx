import React from 'react';
import { connect } from 'react-redux';

import Client from '../client.js';


export const TweetMessage  = React.createClass({
  getInitialState() {
    return { message: '', isValid: true};
  },

  onFormSubmit(evt) {
    let self = this;
    self.props.recordActivity();
    if (self.state.message.length > 3) {
      Client.postTweet(self.props.username, self.state.message)
        .then(function(res) {
          self.props.updatePoints(res.points);
        });
      self.setState({message: '' });
      // evt.preventDefault();
    } else {
      self.props.pushMessage(`Bad input!`);
      self.setState({isValid: false});
      setTimeout(self.setState.bind(self, {isValid: true}), 2000);
    }
  },

  onInputChange(evt) {
    this.setState({message: evt.target.value, isValid: true});
  },

  render() {
    return (
      <div className="ui center aligned basic segment">
        <div className={"ui left icon action input " + (this.state.isValid ? "" : "error")}>
          <i className="talk icon"></i>
          <input type="text"
            placeholder="Message"
            value={this.state.message}
            onChange={this.onInputChange}
            />
          <button className="ui green submit button" onClick={this.onFormSubmit}>Tweet</button>
        </div>
      </div>
    );
  },
})

const mapStateToProps = state => {
  return {
    username: state.usernameReducer
  }
}

import { pushMessageAC, updatePointsAC, recordActivityAC } from '../redux';

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    pushMessage: (message) => dispatch(pushMessageAC(message)),
    updatePoints: (points) => dispatch(updatePointsAC(points)),
    recordActivity: () => dispatch(recordActivityAC())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(TweetMessage);
