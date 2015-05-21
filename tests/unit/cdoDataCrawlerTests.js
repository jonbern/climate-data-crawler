"use strict";
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
  var simulateError;

  var dataset;
  var datatype;
  var locations;

  var offset;
  var count;

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
      },
      {
        "id": "CITY:NL000011",
        "maxdate": "2015-01-31"
      },
      {
        "id": "CITY:RS000021",
        "maxdate": "2015-03-04"
      },
      {
        "id": "CITY:CD000031",
        "maxdate": "1978-12-31"
      }
    ];

    offset = 0;
    count = 500;
    probingStartYear = 2014;
    probingStopYear = 2000;

    timer = new Timer();
    sinon.stub(timer, 'setTimeout', function(callback, delay){
      callback();
    });

    dataQuery = {
      run: function(queryCompleteCallback, errorCallback){
        simulateQueryCompleted = queryCompleteCallback;
        simulateError = errorCallback;
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
      offset, count);
  };

  describe('#Run', function() {
    it('should use CdoDataProbingQuery.createInstance to instantiate dataProbingQuery', function(){
      // arrange
      var crawler = getInstance();

      // act
      crawler.run();

      // assert
      var call = dataQueryFactory.createInstance.getCall(0);
      assert.equal(call.args[0], locations[0].id);
      assert.equal(call.args[1], dataset);
      assert.equal(call.args[2], datatype);
      assert.equal(call.args[3], probingStartYear);
      assert.equal(call.args[4], probingStopYear);
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
      assert.equal(call.args[0], locations[1].id);
      assert.equal(call.args[1], dataset);
      assert.equal(call.args[2], datatype);
      assert.equal(call.args[3], probingStartYear);
      assert.equal(call.args[4], probingStopYear);

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

    describe('status reporting', function(){
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
          var progress = calcProgress(i + 1);
          assert.equal(console.log.calledWith('progress: ' + progress + '%'), true);
        }
      });

      it('should write progress to console when offset > 0 (regression)', function(){
        // arrange
        offset = 2;
        count = 3;

        var crawler = getInstance();

        var calcProgress = function(index){
          return Math.round((index / count) * 100 * 100) / 100
        };

        // act
        crawler.run();
        for (var i = 0; i < count; i++){
          simulateQueryCompleted(null)
        }

        // assert
        for (i = 0; i < count; i++){
          var progress = calcProgress(i + 1);
          assert.equal(console.log.calledWith('progress: ' + progress + '%'), true);
        }
      });

      it('should calculate progress correctly when offset > 0 and count > locations.length', function(){
        // arrange
        offset = 2;
        count = locations.length * 2; // 6 * 2

        var crawler = getInstance();

        var calcProgress = function(index){
          return Math.round((index / (locations.length - offset)) * 100 * 100) / 100
        };

        // act
        crawler.run();
        for (var i = 0; i < locations.length - offset; i++){
          simulateQueryCompleted(null)
        }

        // assert
        for (i = 0; i < locations.length - offset; i++){
          var progress = calcProgress(i + 1);
          assert.equal(console.log.calledWith('progress: ' + progress + '%'), true);
        }
      })
    });

    it('should not exceed the number of queries specified by queryLimit', function(){
      // arrange
      sinon.spy(dataQuery, 'run');
      count = 2;

      var crawler = getInstance();

      // act
      crawler.run();
      for (var i = 0; i < locations.length; i++){
        simulateQueryCompleted(null)
      }

      // assert
      assert.equal(dataQuery.run.callCount, count);
    });

    it('should use locationsOffset as starting index', function(){
      // arrange
      offset = 1;
      var crawler = getInstance();

      // act
      crawler.run();
      simulateQueryCompleted(null);

      // assert
      var call = dataQueryFactory.createInstance.getCall(0);
      assert.equal(call.args[0], locations[offset].id)
    });

    it('should wait at least one second before probing again', function(){
      // arrange
      var crawler = getInstance();

      // act
      crawler.run();
      simulateQueryCompleted();

      // assert
      var call = timer.setTimeout.getCall(0);
      assert.equal(call.args[1] > 1000, true);
      assert.equal(timer.setTimeout.calledOnce, true);
    });

    it('should invoke resultsCallback when finished', function(){
      // arrange
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

    it('should query \'count\' number of locations when offset > 0 (regression)', function(){
      // arrange
      sinon.spy(dataQuery, 'run');

      offset = 3;
      count = 3;

      var crawler = getInstance();

      // act
      crawler.run();
      for (var i = 0; i < count; i++){
        simulateQueryCompleted();
      }

      // assert
      assert.equal(dataQuery.run.callCount, count);
      assert.equal(dataQueryFactory.createInstance.callCount, count);

      for (var j = 0; j < count; j++){
        var call = dataQueryFactory.createInstance.getCall(j);
        assert.equal(call.args[0], locations[offset + j].id);
      }

    });

    it('should not go out of bounds on locations', function(){
      // arrange
      offset = 2;
      count = 3;

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

      var crawler = getInstance();

      // act
      crawler.run();

      // assert
      assert.doesNotThrow(function(){
        for (var i = 0; i < locations.length; i++){
          simulateQueryCompleted(null)
        }
      });
    });

    describe('error handling', function(){
      it('should invoke onError callback', function(){
        // arrange
        var error = "error 123";

        var wasCalled = false;
        var callArguments = null;
        var errorCallback = function(){
          wasCalled = true;
          callArguments = arguments;
        };

        var crawler = getInstance();

        // act
        crawler.run(function(){}, errorCallback);
        simulateError(error);

        // assert
        assert.equal(wasCalled, true);
        assert.equal(callArguments[0], error);
      });
    });

    describe('#continue', function(){
      it('should run query again', function(){
        // arrange
        sinon.spy(dataQuery, 'run');
        var crawler = getInstance();

        // act + assert
        crawler.run();
        assert.equal(dataQuery.run.callCount, 1);

        simulateError('error');
        assert.equal(dataQuery.run.callCount, 1);

        crawler.continue();
        assert.equal(dataQuery.run.callCount, 2);

        var locationIdStopCall =
          dataQueryFactory.createInstance.getCall(0).args[0];
        var locationIdContinueCall =
          dataQueryFactory.createInstance.getCall(1).args[0];

        assert.equal(locationIdStopCall, locationIdContinueCall);
      });
    })
  });

});

