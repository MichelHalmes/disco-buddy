import React from 'react';
import { connect } from 'react-redux';
import { Modal } from 'semantic-ui-react';

import isEmail from 'validator/lib/isEmail';

const CONFIG  = require('../../../config.js');

const ModalSetUser = React.createClass({
  getInitialState: function () {
    return {
      fields: {},
      fieldErrors: {}
    };
  },

  onInputChange(evt) {
    const fields = this.state.fields;
    fields[evt.target.name] = evt.target.value;
    this.setState({ fields });
  },

  validate(person) {
    const errors = {};
    let isValid = true;
    if (!person.username) {
      errors.username = 'Name Required';
      isValid = false;
    } else if (person.username.length > CONFIG.MAX_NAME_LEN) {
      errors.username = `Username too long for our screen (max: ${CONFIG.MAX_NAME_LEN})!`;
      isValid = false;
    }
    if (person.email && !isEmail(person.email)) {
      errors.email = 'Invalid Email';
      isValid = false;
    }
    this.setState({fieldErrors: errors});
    return isValid;
  },

  handleFormSubmit(evt) {
    document.getElementById('yourAudioTag').play(); //Force play as autoplay is not allowed on mobile
    let self = this;
    const person = this.state.fields;
    const isValid = this.validate(person);
    // evt.preventDefault();

    if (!isValid) return;

    console.log(this.props)

    let promise = this.props.postLogin(person.username, person.email)
    console.log('postLogin.sent', promise)

    promise.then(function (isOk){
        console.log('postLogin.then', isOk)
        if (!isOk) {
          self.setState({
            fields: {},
            fieldErrors: Object.assign({},
              self.state.fieldErrors,
              {nameUnique: 'The username you have chosen is already used. Please choose another one!'}
            )
          });
        }
      })
      .catch(function(err){
        console.log('postLogin.catch', err)
      });
  },

  render: function() {
    return (
      <Modal
        open={!this.props.username}
        closeOnEscape={false}
        closeOnRootNodeClick={false}>
        <div className="ui segment">
          <h1>Enter a username </h1>
          <div className={"ui form " + (Object.keys(this.state.fieldErrors).length ? 'error' : '')}>
            <div className="field">
              <label>Username*</label>
              <input name="username" placeholder="Username" value={this.state.fields.name} onChange={this.onInputChange} />
            </div>
            <div className="field">
              <label>Email address</label>
              <input name="email" placeholder="Email" value={this.state.fields.email} onChange={this.onInputChange}/>
              <p>Promise, we won't spam you or give your email to anyone else. This is only for us to send you pictures and information about the event!</p>
            </div>
            <div className="ui error message " >
              <div className="header">Invalid input</div>
              <ul>
                { Object.keys(this.state.fieldErrors).map((key, i) => <li key={i}>{this.state.fieldErrors[key]}</li>) }
              </ul>
            </div>
            <button className="ui submit button green" onClick={this.handleFormSubmit}>
              Submit
            </button>
          </div>
        </div>
      </Modal>
    );
  },
});

const mapStateToProps = state => {
  console.log('ModalSetUser mapStateToProps', state)
  return {
    username: state.appReducer.username
  }
}

import { postLoginAC } from '../redux';

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    postLogin: (username, email) => dispatch(postLoginAC(username, email))
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(ModalSetUser);
