"use strict";
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
  var apiClientFactory;

  var dataset;
  var datatypeid;
  var locationId;
  var startYear;
  var endYear;
  var startDate;
  var endDate;

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

    apiClientFactory = {
      createInstance: function(){
        return api;
      }
    };

    dataset = 'GHCNDMS';
    datatypeid = 'MMNT';
    locationId = 'CITY:BR000023';
    startYear = 2014;
    endYear = 2014;
    startDate = startYear + '-01-01';
    endDate = endYear + '-12-31';
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

  var getInstance = function(){
    return new CdoDataProbingQuery(
      apiClientFactory, timer,
      locationId, dataset, datatypeid, startYear, endYear);
  };

  describe('#run', function(){
    it('should call apiClientFactory with expected parameters', function() {
      // arrange
      sinon.stub(api, 'query');
      sinon.spy(apiClientFactory, 'createInstance');

      var query = getInstance();

      // act
      query.run();

      // assert
     var isCalledWithParameters = apiClientFactory.createInstance.calledWith(
        locationId, dataset, datatypeid, startDate, endDate);

      assert.equal(isCalledWithParameters, true);
    });

    it('should invoke apiClient\'s query method', function() {
      // arrange
      sinon.stub(api, 'query');

      var query = getInstance();

      // act
      query.run();

      // assert
      assert.equal(api.query.called, true);
    });

    describe('#onQueryCompleteCallback', function(){
      it('should call onQueryCompleteCallback with results when receiving data from api client', function(){
        // arrange
        var expectedRunResults = fs.readFileSync('test-resources/dataset.json', {encoding: 'utf8'});
        var actualRunResults = null;

        sinon.stub(api, 'query', function(onApiCallComplete){
          onApiCallComplete(expectedRunResults);
        });

        var query = getInstance();

        // act
        query.run(function(results){
          actualRunResults = results;
        });

        // assert
        assert.notEqual(actualRunResults, null);
        assert.equal(actualRunResults, expectedRunResults);
      });

      it('should be possible to call run without specifying onQueryCompleteCallback', function(){
        // arrange
        var runResults = fs.readFileSync('test-resources/dataset.json', {encoding: 'utf8'});

        sinon.stub(api, 'query', function(onApiCallComplete){
          onApiCallComplete(runResults);
        });

        var query = getInstance();

        // act + assert
        assert.doesNotThrow(function(){
          query.run();
        });
      });

    });

    describe('api returns no data for the current year\'s query', function(){
      it('should query each year until it reaches endYear to probe for data', function(){
        // arrange
        sinon.stub(api, 'query', function(onApiCallComplete){
          onApiCallComplete(null);
        });

        sinon.spy(apiClientFactory, 'createInstance');

        startYear = 2014;
        endYear = 2000;

        var expectedQueryCount = (startYear - endYear) + 1;

        var query = getInstance();

        // act
        query.run();

        // assert
        assert.equal(api.query.callCount, expectedQueryCount);

        for (var i = 0; i < expectedQueryCount; i++){
          var currentQueryYear = startYear - i;
          var expectedStartDate = currentQueryYear + '-01-01';
          var expectedEndDate = currentQueryYear + '-12-31';

          var isCalledWithParameters = apiClientFactory.createInstance.calledWith(
            locationId, dataset, datatypeid, expectedStartDate, expectedEndDate);

          assert.equal(isCalledWithParameters, true);
        }
      });

      describe('#onRunCompleteCallback', function(){
        it('should invoke onRunCompleteCallback when no data until endYear', function(){
          // arrange
          sinon.stub(api, 'query', function(onApiCallComplete){
            onApiCallComplete(null);
          });

          var onRunCompleteCallbackCalled = false;

          startYear = 2014;
          endYear = 2000;

          var query = getInstance();

          // act
          query.run(function(results){
            onRunCompleteCallbackCalled = true;
          });

          // assert
          assert.equal(onRunCompleteCallbackCalled, true);
        });

      });

      it('should pause shortly before probing next year', function() {
        // arrange
        sinon.stub(api, 'query', function(onApiCallComplete){
          onApiCallComplete(null);
        });

        startYear = 2014;
        endYear = 2000;
        var expectedCallCount = startYear - endYear;
        var actualCallCount = 0;

        var actualDelay = null;

        timer.setTimeout.restore();
        sinon.stub(timer, 'setTimeout', function(callback, delay){
          actualDelay = delay;
          actualCallCount++;
          callback();
        });

        var query = getInstance();

        // act
        query.run();

        // assert
        assert.equal(actualDelay, 1000);
        assert.equal(actualCallCount, expectedCallCount);
      });

    });

  });

  describe('#createInstance', function(){
    it('should not return null', function(){
      // arrange
      var query = CdoDataProbingQuery.createInstance('CITY:BR000023', 'GHCNDMS', 'MMNT', 2014, 2000);

      // assert
      assert.notEqual(query, null);
    });
  });

});