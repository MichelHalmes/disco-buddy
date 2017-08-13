import React from 'react';
import {Modal} from 'semantic-ui-react';

import './App.css';


export function Points(props) {
  return (
    <div className="ui center aligned basic segment no-margins">
      <div className="ui labeled button" tabIndex="0">
        <div className="ui basic blue button">
           {props.username}
        </div>
        <a className="ui basic left pointing blue label">
          {props.points} points
        </a>
      </div>
    </div>
  );
}


export function Header(props) {
  return (
    <div >
      <h2 className="no-margins">
        <i className="music icon"></i>
          Disco-Connect
        <i className="music icon"></i>
      </h2>
      <div className="">Find a dancer with your song!</div>
      <div className="ui divider no-margins"></div>
    </div>
  );
}

export function ModalInactivity(props) {
  return (
    <Modal open={props.isInactive} >
      <div className="ui center aligned basic segment">
        <h1>You have been inactive for quite some time...!?</h1>
        <button className="ui submit button green" onClick={props.onReactivate}>
          Continue playing!
        </button>
      </div>
    </Modal>
  );
}
