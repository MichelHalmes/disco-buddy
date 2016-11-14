/* eslint-disable no-console */
/* eslint-disable no-undef */

// function getSong() {
//   return fetch('/api/song', {
//     headers: {
//       Accept: 'application/json',
//     },
//   }).then(checkStatus)
// }

function postLogin(username, email) {
  console.log('/api/login', username);
  return fetch('/api/login', {
    method: 'post',
    body: JSON.stringify({username, email}),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  }).then(checkStatus);
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

function postMatchCode(username, matchCode) {
  console.log('/api/matchcode', username, matchCode);
  return fetch('/api/matchcode', {
    method: 'post',
    body: JSON.stringify({username, matchCode}),
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
    error.status = response.statusText;
    error.response = response;
    console.log(error);
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

module.exports = {
  postLogin,
  getCode,
  postMatchCode
};
