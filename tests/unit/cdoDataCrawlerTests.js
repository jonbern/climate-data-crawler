"use strict";
var should = require('should');
var sinon = require('sinon');
var assert = require('assert');
var CdoApiClient = require('../../cdoApiClient');
var CdoDataProbingQuery = require('../../cdoDataProbingQuery');
var CdoDataCrawler = require('../../cdoDataCrawler');
var HttpClient = require('../../helpers/httpClient');
var Timer = require('../../helpers/timer');

describe('CdoDataCrawler', function(){

  var timer;
  var dataQuery;
  var dataQueryFactory;
  var simulateQueryCompleted;

  var dataset;
  var datatype;
  var locations;

  var locationsOffset;
  var queryLimit;

  var probingStartYear;
  var probingStopYear;

  var dataProbingBounds = {
    getProbingBounds: function(){
      return {
        startYear: probingStartYear,
        stopYear: probingStopYear
      }
    }
  };

  beforeEach(function(){
    dataset = 'GHCNDMS';
    datatype = 'MMNT';

    locations = [
      {
        "id": "CITY:NL000001",
        "maxdate": "2015-01-31"
      },
      {
        "id": "CITY:RS000001",
        "maxdate": "2015-03-04"
      },
      {
        "id": "CITY:CD000001",
        "maxdate": "1978-12-31"
      }
    ];

    locationsOffset = 0;
    queryLimit = 500;
    probingStartYear = 2014;
    probingStopYear = 2000;

    timer = new Timer();
    sinon.stub(timer, 'setTimeout', function(callback, delay){
      callback();
    });

    dataQuery = {
      run: function(queryCompleteCallback){
        simulateQueryCompleted = queryCompleteCallback;
      }
    };

    dataQueryFactory = {
      createInstance: function(){
        return dataQuery;
      }
    };

    sinon.spy(dataQueryFactory, 'createInstance');

    sinon.spy(console, 'log');
  });

  afterEach(function(){
    if (typeof timer.setTimeout.restore == 'function'){
      timer.setTimeout.restore();
    }
    if (typeof dataQueryFactory.createInstance.restore == 'function'){
      dataQueryFactory.createInstance.restore();
    }
    if (typeof console.log.restore == 'function'){
      console.log.restore();
    }
  });

  var getInstance = function(){
    return new CdoDataCrawler(
      dataQueryFactory, dataProbingBounds,
      timer, dataset, datatype, locations,
      locationsOffset, queryLimit);
  };

  describe('#Run', function() {
    it('should use CdoDataProbingQuery.createInstance to instantiate dataProbingQuery', function(){
      // arrange
      var crawler = getInstance();

      // act
      crawler.run();

      // assert
      var call = dataQueryFactory.createInstance.getCall(0);
      call.args[0].should.be.equal(locations[0].id);
      call.args[1].should.be.equal(dataset);
      call.args[2].should.be.equal(datatype);
      call.args[3].should.be.equal(probingStartYear);
      call.args[4].should.be.equal(probingStopYear);
    });

    it('should invoke query by running dataQuery\'s run method', function(){
      // arrange
      sinon.spy(dataQuery, 'run');
      var crawler = getInstance();

      // act
      crawler.run();

      // assert
      assert.equal(dataQuery.run.calledOnce, true);
    });

    it('should instantiate query for next location when first query done', function(){
      // arrange
      var crawler = getInstance();

      // act
      crawler.run();
      simulateQueryCompleted(null);

      // assert
      var call = dataQueryFactory.createInstance.getCall(1);
      call.args[0].should.be.equal(locations[1].id);
      call.args[1].should.be.equal(dataset);
      call.args[2].should.be.equal(datatype);
      call.args[3].should.be.equal(probingStartYear);
      call.args[4].should.be.equal(probingStopYear);

    });

    it('should query next location until all locations have been queried', function(){
      // arrange
      sinon.spy(dataQuery, 'run');
      var crawler = getInstance();

      // act
      crawler.run();
      for (var i = 0; i < locations.length; i++){
        simulateQueryCompleted(null)
      }

      // assert
      assert.equal(dataQuery.run.callCount, locations.length);
    });

    it('should write progress to console', function(){
      // arrange
      var crawler = getInstance();

      var calcProgress = function(index){
        return Math.round((index / locations.length) * 100 * 100) / 100
      };

      // act
      crawler.run();
      for (var i = 0; i < locations.length; i++){
        simulateQueryCompleted(null)
      }

      // assert
      for (i = 0; i < locations.length; i++){
        //simulateQueryCompleted(queryResult)
        var progress = calcProgress(i + 1);
        console.log.calledWith('progress: ' + progress + '%').should.equal(true)
      }
    });

    it('should not exceed the number of queries specified by queryLimit', function(){
      // arrange
      sinon.spy(dataQuery, 'run');
      queryLimit = 2;

      var crawler = getInstance();

      // act
      crawler.run();
      for (var i = 0; i < locations.length; i++){
        simulateQueryCompleted(null)
      }

      // assert
      assert.equal(dataQuery.run.callCount, queryLimit);
    });

    it('should use locationsOffset as starting index', function(){
      // arrange
      locationsOffset = 1;
      var crawler = getInstance();

      // act
      crawler.run();
      simulateQueryCompleted(null);

      // assert
      var call = dataQueryFactory.createInstance.getCall(0);
      call.args[0].should.be.equal(locations[locationsOffset].id);
    });

    it('should wait at least one second before probing again', function(){
      // arrange

      var crawler = getInstance();

      // act
      crawler.run();
      simulateQueryCompleted();

      // assert
      var call = timer.setTimeout.getCall(0);
      call.args[1].should.be.greaterThan(1000);
      timer.setTimeout.calledOnce.should.equal(true);
    });

    it('should invoke resultsCallback when finished', function(){
      // arrange
      sinon.spy(dataQuery, 'run');

      locations = [
        {
          "id": "CITY:NL000001",
          "maxdate": "2015-01-31",
          "dataToReturn": [1,2,3]
        },
        {
          "id": "CITY:RS000001",
          "maxdate": "2015-03-04",
          "dataToReturn": [4,5,6]
        },
        {
          "id": "CITY:CD000001",
          "maxdate": "1978-12-31",
          "dataToReturn": null
        }
      ];

      var expectedCrawlResults = [1,2,3,4,5,6];
      var expectedLocationsNoData = ["CITY:CD000001"];

      var crawler = getInstance();

      var resultsCallbackInvoked = false;
      var actualCrawlResults = null;
      var actualLocationsNoData = null;

      var resultsCallback = function(crawlResults, crawlLocationsNoData){
        resultsCallbackInvoked = true;
        actualCrawlResults = crawlResults;
        actualLocationsNoData = crawlLocationsNoData;
      };

      // act
      crawler.run(resultsCallback);
      simulateQueryCompleted(locations[0].dataToReturn);
      simulateQueryCompleted(locations[1].dataToReturn);
      simulateQueryCompleted(locations[2].dataToReturn);

      // assert
      assert.equal(resultsCallbackInvoked, true);
      assert.equal(JSON.stringify(actualCrawlResults),
        JSON.stringify(expectedCrawlResults));

      assert.equal(JSON.stringify(actualLocationsNoData),
        JSON.stringify(expectedLocationsNoData));

    });

  });

});

