var request = require("request");
var assert = require('assert');
var fs = require('fs');
var sinon = require('sinon');

var base_url = "http://localhost:4000";

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

describe("API", function() {
  describe("GET /api/code", function() {
    var fsStub, randomStub, server;

    before(function(done) {
        fsStub = sinon.stub(fs, 'readdirSync').returns(['a.mp3', 'b.mp3', 'c.mp3']);
        randomStub = sinon.stub(Math, 'random').returns(0.99);
        server = require("./server.js");
        sleep(50);

        request.post({url: base_url+'/api/login', body: JSON.stringify({username: 'x'}), headers: {'Content-Type': 'application/json'} },
        function(error, response, body){
          assert.equal(200, response.statusCode);
          assert.equal('{}', body);
          done();
        }
      );
    });

    after(function(done) {
      fsStub.restore();
      randomStub.restore();
      server.close(done);
      // done();
    });

    it("returns status code 200", function(done) {
      request.get({ url: base_url+'/api/code', headers: {'Authorization': new Buffer('x').toString('base64')} },
        function(error, response, body) {
          assert.equal(200, response.statusCode);
          assert.equal(JSON.stringify({code: '0001', points: 10}), body);
          done();
        }
      );
    });
  });
});
