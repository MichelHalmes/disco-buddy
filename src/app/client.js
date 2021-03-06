/* eslint-disable no-console */
/* eslint-disable no-undef */
import fetch from 'isomorphic-fetch';

function postLogin(username, email) {
  return fetch('/api/login', {
    method: 'post',
    body: JSON.stringify({username, email}),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  }).then(checkStatus)
    .then(parseJSON);
}

function getCode(username) {
  return fetch('/api/code', {
    method: 'get',
    headers: {
      'Accept': 'application/json',
      'Authorization': btoa(username)
    },
  }).then(checkStatus)
    .then(parseJSON);
}

function getSyncTime() {
  return fetch('/api/synctime', {
    method: 'get',
    headers: {
      'Accept': 'application/json'
    },
  }).then(checkStatus)
    .then(parseJSON);
}

function postBuddyCode(username, buddyCode) {
  return fetch('/api/buddycode', {
    method: 'post',
    body: JSON.stringify({username, buddyCode}),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  }).then(checkStatus)
    .then(parseJSON);
}

function postTweet(username, message) {
  return fetch('/api/tweet', {
    method: 'post',
    body: JSON.stringify({username, message}),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  }).then(checkStatus)
    .then(parseJSON);
}


function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(`HTTP Error ${response.statusText}`);
    error.status = response.status;
    error.response = response;
    console.log(response);
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

function retryOnServerError(clientFunc) {
  let retryCount = 0;
  return function wrappedFunction(...args) {
    return new Promise(function (resolve, reject) {
      clientFunc.apply(null, args)
        .then(
          res => { resolve(res) },
          error => {
            if (error.status < 500 || retryCount > 5) {
              reject(error)
            } else {
              retryCount++;
              setTimeout(() => {
                wrappedFunction.apply(null, args)
                  .then(
                    res => { resolve(res) },
                    err => { reject(err) }
                )
              }, 500 * retryCount**2);
            }
          }
        )
    })
  }
}

module.exports = {
  postLogin: retryOnServerError(postLogin),
  getCode: retryOnServerError(getCode),
  getSyncTime: retryOnServerError(getSyncTime),
  postBuddyCode: retryOnServerError(postBuddyCode),
  postTweet: retryOnServerError(postTweet)
};
