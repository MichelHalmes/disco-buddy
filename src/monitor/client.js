/* eslint-disable no-console */
/* eslint-disable no-undef */

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

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const error = new Error(`HTTP Error ${response.statusText}`);
    error.status = response.statusText;
    error.response = response;
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

module.exports = {
  postLogin
};
