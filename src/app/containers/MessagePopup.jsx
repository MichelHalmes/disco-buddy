import React from 'react';
import { connect } from 'react-redux';
import { Popup } from 'semantic-ui-react';

const timeoutLength = 4000;

const MessagePopup = React.createClass({
  getInitialState() {
    return { isOpen: false };
  },

  componentDidUpdate: function (prevProps, prevState) {
    // console.log('message')
    if (this.props.messages.length === 0 || prevProps.messages === this.props.messages) return;
    this.setState({isOpen: true})
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.handleClose();

    }, timeoutLength)
  },

  handleClose()  {
    // console.log('close popup')
    this.setState({isOpen: false});
    this.props.clearMessages();
    clearTimeout(this.timeout);
  },

  render() {
    return (
      <div className="ui center aligned basic segment">
        <Popup
            content={"undefined"}
            open={this.state.isOpen}
            basic
            on="click"
            onClose={this.handleClose}
            inverted
            flowing>
            {this.props.messages.map((msg, i) => <p key={i}>{msg}</p>)}
        </Popup>
      </div>
    );
  }
});

const mapStateToProps = state => {
  return {
    messages: state.messagesReducer
  }
}

import { clearMessagesAC } from '../redux';

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    clearMessages: () => dispatch(clearMessagesAC())
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(MessagePopup);
