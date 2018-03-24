
import React from 'react';
import { connect } from 'react-redux';
import { Dimmer } from 'semantic-ui-react';

// import Client from '../Client.js';

const CONFIG  = require('../../../config.js');


const CodeArea = React.createClass({

  getInitialState() {
    return {buddyCode: '', isValid: true, disableDimmer: false};
  },

  onInputChange(evt) {
    this.props.recordActivity();
    const buddyCode = evt.target.value;
    const isValid = this.validate(buddyCode);
    this.setState({ buddyCode, isValid });

    if (isValid && buddyCode.length == 4) {
      setTimeout(this.setState.bind(this, { buddyCode: '' }), 1000);
      this.props.postBuddyCode(buddyCode)
        .then((ok) => {
          if (!ok) { // not a match
            this.setState({ isValid: false })
            setTimeout(this.setState.bind(this, { isValid: true }), 1000);
          }
        })
    }    
  },

  validate(buddyCode) {
    return buddyCode && buddyCode>=0 && buddyCode<=9999;
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (this.props.matchedCurrentCode && !prevProps.matchedCurrentCode) { // Just matched the code
      this.setState({ disableDimmer: false });
    }
  },

  onDimmerClick(evt) {
    if (this.props.matchedCurrentCode) {
      this.setState({ disableDimmer: true })
    }
  },

  render() {
    return (
    <div className="ui centered grid no-margins">
      <div className="ui twelve wide column center aligned raised segment no-margins">
        <div>Give your code to a buddy</div>
        <div className="ui black basic big label">
          <i className="exchange icon"></i>
          {this.props.matchedCurrentCode ? '- - - -': (this.props.code || '????')}
        </div>
        <div className="ui horizontal divider no-margins">
          Or
        </div>
        <div>Enter a buddy's code</div>
        <div className={"ui left icon focus large input " + (this.state.isValid ? "" : "error")}>
          <i className="exchange black icon "></i>
          <input type="number"
            placeholder="Code"
            value={this.state.buddyCode}
            onChange={this.onInputChange}
            style={{maxWidth: '110px'}}
          />
          {/* <button className={"ui green button " + (this.state.buddyCode ? "submit" : "disabled")} onClick={this.onFormSubmit}>
            Enter
          </button> */}
        </div>

        <Dimmer active={this.props.matchedCurrentCode && !this.state.disableDimmer} onClick={this.onDimmerClick}>
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
