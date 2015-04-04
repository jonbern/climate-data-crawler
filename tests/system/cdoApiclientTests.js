"use strict";
var assert = require('assert');
var should = require('should');
var sinon = require('sinon');
var cdoApiClient = require('../../cdoApiClient');
var events = require('events');
var Logger = require('../../helpers/logger');
var HttpClient = require('../../helpers/httpClient');
var Timer = require('../../helpers/timer');

describe('CdoApiClient', function(){
  describe('#invoke', function(){

    var getInstance = function() {
      var httpClient = new HttpClient();

      var logger = new Logger();
      sinon.stub(logger, 'info');

      var eventEmitter = new events.EventEmitter();
      var timer = new Timer();

      return new cdoApiClient(
        httpClient, logger, eventEmitter, timer);
    };

    it('should raise done event', function(done){
      // arrange
      this.timeout(120 * 1000);

      var api = getInstance();
      var eventEmitter = api.getEventEmitter();

      // act
      api.query({
        dataset: 'GHCNDMS',
        datatypeid: 'MNTM',
        locationId: 'CITY:BR000023',
        startDate: '1983-01-01',
        endDate: '1983-12-31'
      });

      // assert
      eventEmitter.on('done', function(result){
        console.log(result);
        result.should.not.be.null;
        done();
      });
    });

    it('should raise done even also when api only returns an empty object', function(done){
      // arrange
      this.timeout(120 * 1000);

      var api = getInstance();
      var eventEmitter = api.getEventEmitter();

      // act
      api.query({
        dataset: 'GHCNDMS',
        datatypeid: 'MNTM',
        locationId: 'CITY:BR000023',
        startDate: '2000-01-01',
        endDate: '2000-12-31'
      });

      // assert
      eventEmitter.on('done', function(result){
        assert.equal(result, null);
        done();
      });
    });

  })
});
