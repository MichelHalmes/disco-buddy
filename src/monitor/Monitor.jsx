import React from 'react';
import Client from './client.js';

import io from 'socket.io-client';


import { Modal, Popup, Grid} from 'semantic-ui-react'


const Monitor = React.createClass({

  render() {
    return (
      
        <div className="ui two column internally celled grid">
          <div className="column">
            <Header/>
            <Statistics />
          </div>
          <div className="column">
            <NewsFeed />
          </div>
        </div>
    );
  }
});

export default Monitor;

const NewsFeed = React.createClass({
  getInitialState: function () {
    const initalMessage = `Welcome to disco-match!
    Here is how it works:
       + Login by providing a username and optionally your email
       + Plug your headphones
       + A song will start playing (be patient...). 
       + Dance and sing along as much as you can!
       + Identify other dancers with the same song as yours
       + Exchange codes to gain points (One exchange is enough for both of you)
       + Keep playing!`;
    return {
      newsEvents: [{type: 'message', points: +0, data: {username: 'Disco-Match', message: initalMessage}}]
    };
  },

  componentDidMount: function () {
    let self = this;

    self.socket = io('/monitor');
    
    self.socket.on('send:newsEvent', function (event) {
      let events = self.state.newsEvents;
      events.push(event);
      if (events.length > 3) {
        events.swift()
      }
      self.setState({newsEvents: events});
    });
  },

  render() {

    return (
      <div className="ui feed" >
        {this.state.newsEvents.map((evt, i) => <NewsEvent event={evt} key={i}/>)}
      </div> 
    );
  }
});

// <NewsEvent event={{type: 'match', points: +50, data: {username: 'Michel', matchUsername: 'Petra', song: 'Recondite'}}} />
// <NewsEvent event={{type: 'next', points: -5, data: {username: 'Michel', song: 'Recondite'}}} />
// <NewsEvent event={{type: 'message', points: +1, data: {username: 'Michel', message: 'Whow, this is amazing!'}}} />
// <NewsEvent event={{type: 'login', points: +10, data: {username: 'Michel', message: 'Whow, this is amazing!'}}} />
        




function NewsEvent({event}) {
  const EVENT_TYPE_ICON = {
    match: 'exchange',
    next: 'forward',
    message: 'comment',
    login: 'add user'
  };

  function formatSummary (event) {
    let data = event.data;
    switch(event.type) {
      case 'match':
        return (
          <div>
            <a>{data.username}</a> found <a>{data.matchUsername}</a> on <a>{data.song}</a>
          </div>);
      case 'next':
        return (
          <div>
            <a>{data.username}</a> didn't like <a>{data.song}</a>
          </div>);
      case 'message':
        return (
          <div>
            <a>{data.username}:</a> {data.message.split('\n').map((s, i) => <div key={i}>{s}</div>)}
          </div>);
      case 'login':
        return (
          <div>
            <a>{data.username}</a> joined. Welcome!
          </div>);
    }
  }
  
  return (
    <div className="event" >
      <div className="label" >
        <i className={`big ${EVENT_TYPE_ICON[event.type]} icon`}></i>
      </div> 
      <div className="content" >
        <div className="summary" >
          {formatSummary(event)}
        </div>
        <div className="meta" >
          {event.points} Points 
        </div>
      </div>
    </div> 
  );
}



function Header(props) {
  return (
    <div className="ui center aligned basic segment" >
      <h2 >
        <i className="music icon"></i> 
        Disco Match 
        <i className="music icon"></i> 
      </h2>
      <p className="side-margins">Find a dancer with your song</p>
      <div className="ui divider"></div>
    </div>
   
  );
}

function Statistics(props) {
  return (
    <div className="ui two column centered grid" >
      <div className="column">
        <div className="ui mini statistics">
          <div className="ui statistic">
            <div className="value">
              <i className="child icon"> </i> 
              <a> 500 </a>
            </div>  
            <div className="label"> Players </div>  
          </div>
          <div className="ui statistic">
            <div className="value"> 
              <i className="music icon"> </i> 
              <a> 20 </a>
            </div>  
            <div className="label"> Songs </div>  
          </div>
        </div>
      </div>
    </div>
  );
}