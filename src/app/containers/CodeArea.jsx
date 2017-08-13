
import React from 'react';
import { connect } from 'react-redux';
import { Dimmer } from 'semantic-ui-react';

// import Client from '../Client.js';

const CONFIG  = require('../../../config.js');


const CodeArea = React.createClass({

  getInitialState() {
    return {matchCode: '', isValid: true};
  },

  onFormSubmit(evt) {
    this.props.onActivity();
    const matchCode = this.state.matchCode;
    const isValid = this.validate(matchCode);
    // evt.preventDefault();

    if (isValid) {
      this.props.postMatchCode(matchCode);
      this.setState({matchCode: ''});
    } else {
      this.props.pushMessage(`Bad input!`);
      this.setState({isValid: false});
      setTimeout(this.setState.bind(this, {isValid: true}), 2000);
    }
  },

  onInputChange(evt) {
    this.setState({ matchCode: evt.target.value, isValid: true});
  },

  validate(matchCode) {
    return matchCode && matchCode>=0 && matchCode<=9999;
  },

  render() {
    return (
    <div className="ui centered grid no-margins">
      <div className="ui twelve wide column center aligned raised segment no-margins">
        <div>Give your code to a match </div>
        <div className="ui black button">
          <i className="exchange icon"></i>
          {this.props.code || '????'}
        </div>
        <div className="ui horizontal divider no-margins">
          Or
        </div>
        <div>Enter code of a match</div>
        <div className={"ui left icon action input " + (this.state.isValid ? "" : "error")}>
          <i className="exchange icon"></i>
          <input type="number"
            placeholder="Code"
            value={this.state.matchCode}
            onChange={this.onInputChange}
            style={{maxWidth: '110px'}}
            />
          <button className="ui green submit button" onClick={this.onFormSubmit}>
            Enter
          </button>
        </div>

        <Dimmer active={this.props.matchedCurrentCode}>
          <p className="no-margins">{`Match! +${CONFIG.POINTS_MATCH} Points!`}</p>
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

import { postMatchCodeAC, pushMessageAC } from '../redux';

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    postMatchCode: (matchCode) => dispatch(postMatchCodeAC(matchCode)),
    pushMessage: () => dispatch(pushMessageAC())
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(CodeArea);
