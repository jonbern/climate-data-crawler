"use strict";
var should = require('should');
var HttpClient = require('../../helpers/httpClient');

describe('HttpClient', function(){
  describe('#request', function(){

    it('query api using http', function(done){
      var options = {
        host : 'www.ncdc.noaa.gov',
        port : 80,
        path : '/cdo-web/api/v2/locations/CITY:BR000023',
        method : 'GET',
        headers: {'token': 'xdZVZowcEuqclhVhBdziSjGXgHUVKHTD'}
      };

      var expected = {
        "id": "CITY:BR000023",
        "name": "Rio de Janeiro, BR",
        "datacoverage": 1,
        "mindate": "1938-01-01",
        "maxdate": "1999-12-31"
      };

      var client = new HttpClient();

      client.request(options, function(result){
        result.should.be.equal(JSON.stringify(expected));
        done();
      });
    });

    it('handle error, query error callback', function(done){
      var options = {
        host : 'www.not.a.valid.hostname',
        port : 80,
        path : '/undefined',
        method : 'GET',
        headers: {'token': 'xdZVZowcEuqclhVhBdziSjGXgHUVKHTD'}
      };

      var client = new HttpClient();

      client.request(options, function(result){}, function(error){
        error.should.be.defined;
        done();
      });
    })
  })
});
