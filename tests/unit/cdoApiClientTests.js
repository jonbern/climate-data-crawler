"use strict";
var should = require('should');
var sinon = require('sinon');
var assert = require('assert');
var CdoApiClient = require('../../cdoApiClient');
var events = require('events');
var Logger = require('../../helpers/logger');
var HttpClient = require('../../helpers/httpClient');
var Timer = require('../../helpers/timer');
var fs = require("fs");

describe('CdoClient', function(){

  var eventEmitter;
  var logger;
  var httpClient;
  var timer;
  var apiKey = "123-API-KEY";

  var dataset;
  var datatypeid;
  var locationId;
  var startDate;
  var endDate;

  beforeEach(function(){
    eventEmitter = new events.EventEmitter();

    dataset = 'GHCND';
    datatypeid = 'PRCP';
    locationId = 'CITY:AS000002';
    startDate = '2012-01-01';
    endDate = '2012-06-01';

    logger = new Logger();
    sinon.stub(logger, 'error');
    sinon.stub(logger, 'info');

    httpClient = new HttpClient();

    timer = new Timer();
    sinon.stub(timer, 'setTimeout', function(callback, delay){
      callback();
    });

    sinon.stub(fs, 'readFileSync', function(filepath, encoding){
      return apiKey;
    });

  });

  afterEach(function(){
    if (typeof httpClient.request.restore == 'function'){
      httpClient.request.restore();
    }
    if (typeof logger.error.restore == 'function'){
      logger.error.restore();
    }
    if (typeof eventEmitter.emit.restore == 'function'){
      eventEmitter.emit.restore();
    }
    if (typeof timer.setTimeout.restore == 'function'){
      timer.setTimeout.restore();
    }
    if (typeof fs.readFileSync.restore == 'function'){
      fs.readFileSync.restore();
    }
  });

  var getInstance = function(){
    return new CdoApiClient(
      httpClient, logger, eventEmitter, timer,
      dataset, datatypeid, locationId, startDate, endDate);
  };

  describe('#invoke', function() {
    it('should use dataset from constructor argument', function() {
      // arrange
      dataset = "mydataset";

      sinon.stub(httpClient, 'request');
      var client = getInstance();

      var expected = '/cdo-web/api/v2/data?'
        + 'datasetid=mydataset'
        + '&locationid=CITY:AS000002'
        + '&startdate=2012-01-01'
        + '&enddate=2012-06-01'
        + '&datatypeid=PRCP'
        + '&limit=1000'
        + '&offset=1';

      // act
      client.query();

      // assert
      httpClient.request.getCall(0).args[0].path
        .should.equal(expected);
    });

    it('should use locationid from constructor argument', function() {
      // arrange
      locationId = "AO:MYCITY";

      sinon.stub(httpClient, 'request');
      var client = getInstance();

      var expected = '/cdo-web/api/v2/data?'
        + 'datasetid=GHCND'
        + '&locationid=AO:MYCITY'
        + '&startdate=2012-01-01'
        + '&enddate=2012-06-01'
        + '&datatypeid=PRCP'
        + '&limit=1000'
        + '&offset=1';

      // act
      client.query();

      // assert
      httpClient.request.getCall(0).args[0].path
        .should.equal(expected);
    });

    it('should use enddate from constructor parameter', function() {
      // arrange
      endDate = "23-10-1983";

      sinon.stub(httpClient, 'request');
      var client = getInstance();

      var expected = '/cdo-web/api/v2/data?'
        + 'datasetid=GHCND'
        + '&locationid=CITY:AS000002'
        + '&startdate=2012-01-01'
        + '&enddate=23-10-1983'
        + '&datatypeid=PRCP'
        + '&limit=1000'
        + '&offset=1';

      // act
      client.query();

      // assert
      httpClient.request.getCall(0).args[0].path
        .should.equal(expected);
    });

    it('should use startdate from constructor argument', function() {
      // arrange
      startDate = "23-10-1983";

      sinon.stub(httpClient, 'request');
      var client = getInstance();

      var expected = '/cdo-web/api/v2/data?'
        + 'datasetid=GHCND'
        + '&locationid=CITY:AS000002'
        + '&startdate=23-10-1983'
        + '&enddate=2012-06-01'
        + '&datatypeid=PRCP'
        + '&limit=1000'
        + '&offset=1';

      // act
      client.query();

      // assert
      httpClient.request.getCall(0).args[0].path
        .should.equal(expected);
    });

    it('should use httpClient to make http request', function(){
      // arrange
      sinon.stub(httpClient, 'request');
      var client = getInstance();

      // act
      client.query();

      // assert
      httpClient.request.called.should.be.true;
    });

    it('should throw exception when status != 200', function(){
      // arrange
      var stubRequest = function(options, successCallback, errorCallback){
        errorCallback("error");
      };
      sinon.stub(httpClient, 'request',stubRequest);

      var client = getInstance();

      // act
      client.query();

      // assert
      logger.error.called.should.be.true;
    });

    it('should use httpClient using correct options', function(){
      // arrange
      var stubRequest = function(options, successCallback, errorCallback) {
        successCallback(JSON.stringify({}));
      };
      sinon.stub(httpClient, 'request', stubRequest);

      var client = getInstance();

      var expectedOptions = {
        host : 'www.ncdc.noaa.gov',
        port : 80,
        path : '/cdo-web/api/v2/data?datasetid=GHCND&locationid=CITY:AS000002&startdate=2012-01-01&enddate=2012-06-01&datatypeid=PRCP&limit=1000&offset=1',
        method : 'GET',
        headers: {'token': apiKey}
      };

      // act
      client.query();

      // assert
      httpClient.request.calledWith(expectedOptions)
        .should.be.true;
    });

    describe("data paging functionality", function(){
      it('should make another httpRequest against api if there is more data to query (data paging)', function(){
        // arrange
        var apiResult = {
          'metadata': {
            'resultset': {
              'limit': 25,
              'count': 100,
              'offset': 1
            }
          }
        };
        var counter = 0;
        var stubRequest = function(options, successCallback, errorCallback) {
          var resultset = apiResult.metadata.resultset;
          resultset.offset = (counter * resultset.limit) + 1;
          counter++;
          successCallback(JSON.stringify(apiResult));
        };
        sinon.stub(httpClient, 'request', stubRequest);

        var client = getInstance();
        sinon.spy(client, 'query');

        // act
        client.query();

        // assert
        var queryPath = '/cdo-web/api/v2/data?datasetid=GHCND&locationid=CITY:AS000002&startdate=2012-01-01&enddate=2012-06-01&datatypeid=PRCP&limit=1000';

        httpClient.request.getCall(0).args[0].path
          .should.equal(queryPath + '&offset=1');

        httpClient.request.getCall(1).args[0].path
          .should.equal(queryPath + '&offset=26');

        httpClient.request.getCall(2).args[0].path
          .should.equal(queryPath + '&offset=51');

        httpClient.request.getCall(3).args[0].path
          .should.equal(queryPath + '&offset=76');
      });

      it('should make delayed api calls in case there is more data to query', function(){
        // arrange
        var apiResult = {
          'metadata': {
            'resultset': {
              'limit': 25,
              'count': 50,
              'offset': 1
            }
          }
        };
        var counter = 0;
        var stubRequest = function(options, successCallback, errorCallback) {
          var resultset = apiResult.metadata.resultset;
          resultset.offset = (counter * resultset.limit) + 1;
          counter++;
          successCallback(JSON.stringify(apiResult));
        };

        sinon.stub(httpClient, 'request', stubRequest);
        var client = getInstance();

        // act
        client.query();

        // assert
        timer.setTimeout.getCall(0).args[1].should.be.greaterThan(1000);

      });
    });

    describe('emit event', function(){

      it('should emit done when there is no more data to query', function(){
        // arrange
        var apiResult = {
          'metadata': {
            'resultset': {
              'limit': 25,
              'count': 15,
              'offset': 1
            }
          }
        };
        var stubRequest = function(options, successCallback, errorCallback) {
          successCallback(JSON.stringify(apiResult));
        };

        sinon.stub(httpClient, 'request', stubRequest);
        sinon.spy(eventEmitter, 'emit');

        var client = getInstance();

        // act
        client.query();

        // assert
        assert.equal(eventEmitter.emit.calledWith('done'), true);
      });

      it('event should contain api results', function(){
        // arrange
        var expectedResults = {
          "results": [
            {"example": [1,2,3] }, { "example": [4,5,6]}
          ],
          'metadata': {
            'resultset': {
              'limit': 25,
              'count': 2,
              'offset': 1
            }
          }
        };

        var stubRequest = function(options, successCallback, errorCallback) {
          successCallback(JSON.stringify(expectedResults));
        };
        sinon.stub(httpClient, 'request', stubRequest);
        var spy = sinon.spy(eventEmitter, 'emit');

        var client = getInstance();

        // act
        client.query(0);

        // assert
        assert.equal(spy.calledWith('done', expectedResults.results), true);
      });

      it('should handle empty result {} from api and emit done', function(){
        // arrange
        var apiResult = {};
        var stubRequest = function(options, successCallback, errorCallback) {
          successCallback(JSON.stringify(apiResult));
        };
        sinon.stub(httpClient, 'request', stubRequest);
        var spy = sinon.spy(eventEmitter, 'emit');

        var client = getInstance();

        // act
        client.query();

        // assert
        spy.calledWith('done', null).should.be.true;
      });

    });

    describe('result callback', function(){
      it('should return api result', function(){
        // arrange
        var expectedResults = {
          "results": [
            {"example": [1,2,3] }, { "example": [4,5,6]}
          ],
          'metadata': {
            'resultset': {
              'limit': 25,
              'count': 2,
              'offset': 1
            }
          }
        };

        var stubRequest = function(options, successCallback, errorCallback) {
          successCallback(JSON.stringify(expectedResults));
        };
        sinon.stub(httpClient, 'request', stubRequest);

        var actualResults = null;
        var resultCallback = function(result){
          actualResults = result;
        };

        var client = getInstance();

        // act
        //client.query(0, resultCallback);
        client.query(resultCallback);

        // assert
        assert.equal(JSON.stringify(actualResults),
          JSON.stringify(expectedResults.results));
      });
    });

    describe('api token', function(){
      it('should read api-token from file', function(){
        // arrange
        var client = getInstance();

        // act
        client.query();

        // assert
        var call = fs.readFileSync.getCall(0);
        call.args[0].should.equal('apitoken.txt');
        call.args[1].should.equal('utf8');
      });

      it('should write helpful message when there is no api-token file', function(){
        // arrange
        fs.readFileSync.restore();
        sinon.stub(fs, 'readFileSync', function(filepath, encoding){
          throw new Error('ENOENT, no such file or directory');
        });

        var expectedMessage = "Please make sure there is an apitoken.txt file (containing your API token) in the executing directory.";

        var client = getInstance();

        // act
        client.query();

        // assert
        assert.equal(logger.info.called, true);
        assert.equal(logger.info.calledWith(expectedMessage), true);
      });
    });

  });

  describe('#getEventEmitter()', function(){
    it('should return eventEmitter instance', function(){
      var client = getInstance();

      client.getEventEmitter().should.not.be.null;
      client.getEventEmitter().should.not.be.undefined;
      client.getEventEmitter().should.be.equal(eventEmitter);
    })
  });

  describe('#createInstance()', function(){
    it('return not null', function(){
      // arrange
      var apiClient = CdoApiClient.createInstance(
        dataset, datatypeid, locationId, startDate, endDate);

      // assert
      apiClient.should.not.be.null;
    });

    it('should use the factory arguments and pass to httpClient', function() {
      // arrange
      sinon.stub(httpClient, 'request');

      var client = CdoApiClient.createInstance(dataset,
        datatypeid, locationId, startDate, endDate,
        httpClient);

      var expected = '/cdo-web/api/v2/data?'
        + 'datasetid=GHCND'
        + '&locationid=CITY:AS000002'
        + '&startdate=2012-01-01'
        + '&enddate=2012-06-01'
        + '&datatypeid=PRCP'
        + '&limit=1000'
        + '&offset=1';

      // act
      client.query();

      // assert
      assert.equal(httpClient.request.called, true);
      httpClient.request.getCall(0).args[0].path
        .should.equal(expected);
    });

  });

});

