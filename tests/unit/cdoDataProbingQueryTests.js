"use strict";
var should = require('should');
var assert = require('assert');
var sinon = require('sinon');
var CdoApiClient = require('../../cdoApiClient');
var CdoDataProbingQuery = require('../../cdoDataProbingQuery');
var Logger = require('../../helpers/logger');
var HttpClient = require('../../helpers/httpClient');
var events = require('events');
var Timer = require('../../helpers/timer');
var fs = require('fs');

describe('CdoDataProbingQuery', function(){

  var api;
  var eventEmitter;
  var logger;
  var httpClient;
  var timer;

  beforeEach(function(){
    eventEmitter = new events.EventEmitter();

    logger = new Logger();
    sinon.stub(logger, 'error');
    sinon.stub(logger, 'info');

    httpClient = new HttpClient();
    sinon.stub(httpClient, 'request');

    timer = new Timer();
    sinon.stub(timer, 'setTimeout', function(callback, delay){
      callback();
    });

    api = new CdoApiClient(
      httpClient, logger, eventEmitter,timer);
  });

  afterEach(function(){
    if (typeof api.query.restore == 'function'){
      api.query.restore();
    }
    if (typeof eventEmitter.emit.restore == 'function'){
      eventEmitter.emit.restore();
    }
    if (typeof timer.setTimeout.restore == 'function'){
      timer.setTimeout.restore();
    }
  });

  var getInstance = function(locationId, dataset, datatypeid, startYear, endYear){
    return new CdoDataProbingQuery(
      api, timer, {
        locationId: locationId,
        dataset: dataset,
        datatypeid: datatypeid,
        startYear: startYear,
        endYear: endYear
      });
  };

  describe('#run', function(){
    it('should call apiClient\'s query method', function() {
      // arrange
      sinon.stub(api, 'query');

      var params = {
            dataset: 'GHCNDMS',
            datatypeid: 'MMNT',
            locationId: 'CITY:BR000023',
            startDate: '2014-01-01',
            endDate: '2014-12-31'
      };

      var crawler = getInstance(
        params.locationId, params.dataset,
        params.datatypeid, 2014);

      // act
      crawler.run();

      // assert
      api.query.calledWith(params)
        .should.be.true;
    });

    it('should call onRunCompleteCallback with results when receiving data from api client', function(){
      // arrange
      var dataset = fs.readFileSync('test-resources/dataset.json', {encoding: 'utf8'});

      sinon.stub(api, 'query', function(){
        eventEmitter.emit('done', dataset);
      });

      var runResults;
      var onRunComplete = function(results){
        runResults = results;
      };

      // act
      var query = getInstance('CITY:BR000023', 'GHCNDMS', 'MMNT', 2014);
      query.run(onRunComplete);

      // assert
      assert.notEqual(runResults, null);
      runResults.should.be.equal(dataset);
    });

    it('should be possible to call run without specifying onRunCompletecallback', function(){
      // arrange
      var dataset = fs.readFileSync('test-resources/dataset.json', {encoding: 'utf8'});

      sinon.stub(api, 'query', function(){
        eventEmitter.emit('done', dataset);
      });

      // act
      var query = getInstance('CITY:BR000023', 'GHCNDMS', 'MMNT', 2014);

      // assert
      assert.doesNotThrow(function(){
        query.run();
      });
    });

    it('should try one year earlier (until endDate) if no data from server', function(){
      // arrange
      sinon.stub(api, 'query', function(){
        eventEmitter.emit('done', null);
      });

      var startYear = 2014;
      var endYear = 2000;
      var queryCount = (startYear - endYear) + 1;

      // act
      var query = getInstance(
        'CITY:BR000023', 'GHCNDMS', 'MMNT', startYear, endYear);
      query.run();

      // assert
      var finalCallParameters = {
        dataset: 'GHCNDMS',
        datatypeid: 'MMNT',
        locationId: 'CITY:BR000023',
        startDate: endYear + '-01-01',
        endDate: endYear + '-12-31'
      };

      api.query.calledWith(finalCallParameters).should.be.true;
      api.query.callCount.should.be.equal(queryCount);
    });

    it('should still query onRunCompleteCallback even if there was no data returned from data until 1983', function(){
      // arrange
      sinon.stub(api, 'query', function(){
        eventEmitter.emit('done', null);
      });

      var runResults;
      var callbackCalled = false;
      var onRunComplete = function(results){
        runResults = results;
        callbackCalled = true;
      };

      // act
      var query = getInstance('CITY:BR000023', 'GHCNDMS', 'MMNT', 2014);
      query.run(onRunComplete);

      // assert
      callbackCalled.should.be.true;
      assert.equal(runResults, null);

    });

    it('should pause shortly before doing next query if current year does not have results', function() {
      // arrange
      sinon.stub(api, 'query', function(){
        eventEmitter.emit('done', null);
      });

      // act
      var query = getInstance('CITY:BR000023', 'GHCNDMS', 'MMNT', 2014, 2000);
      query.run();

      // assert
      timer.setTimeout.getCall(0).args[1].should.be.greaterThan(500);
    });

  });

  describe('#createInstance', function(){
    it('should not return null or undefined', function(){
      // arrange
      var query = CdoDataProbingQuery.createInstance('CITY:BR000023', 'GHCNDMS', 'MMNT', 2014, 2000);

      // assert
      query.should.not.be.null;
      query.should.not.be.undefined;
    });

  });

});