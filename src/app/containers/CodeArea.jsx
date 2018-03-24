
import React from 'react';
import { connect } from 'react-redux';
import { Dimmer } from 'semantic-ui-react';

// import Client from '../Client.js';

const CONFIG  = require('../../../config.js');


const CodeArea = React.createClass({

  getInitialState() {
    return {buddyCode: '', isValid: true};
  },

  onFormSubmit(evt) {
    this.props.recordActivity();
    const buddyCode = this.state.buddyCode;
    const isValid = this.validate(buddyCode);
    // evt.preventDefault();

    if (isValid) {
      this.props.postBuddyCode(buddyCode);
      this.setState({buddyCode: ''});
    } else {
      this.props.pushMessage(`Bad input!`);
      this.setState({isValid: false});
      setTimeout(this.setState.bind(this, {isValid: true}), 2000);
    }
  },

  onInputChange(evt) {
    this.setState({ buddyCode: evt.target.value, isValid: true});
  },

  validate(buddyCode) {
    return buddyCode && buddyCode>=0 && buddyCode<=9999;
  },

  render() {
    return (
    <div className="ui centered grid no-margins">
      <div className="ui twelve wide column center aligned raised segment no-margins">
        <div>Give your code to a buddy</div>
        <div className="ui black basic big label">
          <i className="exchange icon"></i>
          {this.props.code || '????'}
        </div>
        <div className="ui horizontal divider no-margins">
          Or
        </div>
        <div>Enter a buddy's code</div>
        <div className={"ui left icon action input " + (this.state.isValid ? "" : "error")}>
          <i className="exchange icon"></i>
          <input type="number"
            placeholder="Code"
            value={this.state.buddyCode}
            onChange={this.onInputChange}
            style={{maxWidth: '110px'}}
          />
          <button className={"ui green button " + (this.state.buddyCode ? "submit" : "disabled")} onClick={this.onFormSubmit}>
            Enter
          </button>
        </div>

        <Dimmer active={this.props.matchedCurrentCode}>
          <p className="no-margins">{`Well done! +${CONFIG.POINTS_MATCH} Points!`}</p>
          <i className="huge smile icon"></i>
          <p className="no-margins">Click "Next" for a new song... </p>
          <p>{`Or listen till the end to get +${CONFIG.POINTS_SONG_END} Points!`}</p>
        </Dimmer>
      </div>
    </div>
    );
  }
});

const mapStateToProps = state => {
  return {
    code: state.codeReducer.code,
    matchedCurrentCode: state.codeReducer.matchedCurrentCode,
  }
}

import { postBuddyCodeAC, pushMessageAC, recordActivityAC } from '../redux';

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    postBuddyCode: (buddyCode) => dispatch(postBuddyCodeAC(buddyCode)),
    pushMessage: (message) => dispatch(pushMessageAC(message)),
    recordActivity: () => dispatch(recordActivityAC())
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(CodeArea);
