"use strict";
var assert = require('assert');
var HttpClient = require('../../helpers/httpClient');

describe('HttpClient', function(){
  describe('#request', function(){

    it('query api using http', function(done){
      var options = {
        host : 'www.bt.no',
        port : 80,
        method : 'GET'
      };

      var client = new HttpClient();

      client.request(options, function(result){
        assert.equal(!!result, true);
        done();
      });
    });

    it('handle error, query error callback', function(done){
      var options = {
        host : 'www.not.a.valid.hostname',
        port : 80,
        path : '/undefined',
        method : 'GET'
      };

      var client = new HttpClient();

      client.request(options, function(result){}, function(error){
        assert.notEqual(error, null);
        done();
      });
    })
  })
});
