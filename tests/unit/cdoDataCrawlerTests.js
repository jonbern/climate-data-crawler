"use strict";
var should = require('should');
var sinon = require('sinon');
var assert = require('assert');
var CdoApiClient = require('../../cdoApiClient');
var CdoDataProbingQuery = require('../../cdoDataProbingQuery');
var CdoDataCrawler = require('../../cdoDataCrawler');
var resultsWriter = require('../../helpers/resultsWriter.js');
var events = require('events');
var Logger = require('../../helpers/logger');
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

  var queryResult;

  var locationsOffset;
  var queryLimit;

  var probingStartYear;
  var probingStopYear;

  var dataProbingBounds = {
    getProbingBounds: function(latestClimateDataDate){
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
        "name": "'s-Hertogenbosch, NL",
        "datacoverage": 1,
        "mindate": "1950-12-01",
        "maxdate": "2015-01-31"
      },
      {
        "id": "CITY:RS000001",
        "name": "Abakan, RS",
        "datacoverage": 0.9985,
        "mindate": "1910-12-01",
        "maxdate": "2015-03-04"
      },
      {
        "id": "CITY:CD000001",
        "name": "Abeche, CD",
        "datacoverage": 0.9253,
        "mindate": "1950-01-01",
        "maxdate": "1978-12-31"
      }
    ];

    queryResult = ['1', '2', '3'];
    locationsOffset = 0;
    queryLimit = 500;
    probingStartYear = 2014;
    probingStopYear = 2000;

    timer = new Timer();
    sinon.stub(timer, 'setTimeout', function(callback, delay){
      callback();
    });

    sinon.stub(resultsWriter, 'write');

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
    if (typeof resultsWriter.write.restore == 'function'){
      resultsWriter.write.restore();
    }
    if (typeof dataQueryFactory.createInstance.restore == 'function'){
      dataQueryFactory.createInstance.restore();
    }
    if (typeof console.log.restore == 'function'){
      console.log.restore();
    }
  });

  var getInstance = function(){
    var crawler = new CdoDataCrawler(
      dataQueryFactory, dataProbingBounds,
      resultsWriter, timer, dataset, datatype, locations,
      locationsOffset, queryLimit);

    return crawler;
  };

  describe('#Run', function() {
    it('should use CdoDataProbingQuery.createInstance with expected parameters', function(){
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

    it('when first query done, instantiate query for next location', function(){
      // arrange
      var crawler = getInstance();

      // act
      crawler.run();
      simulateQueryCompleted(queryResult);

      // assert
      var call = dataQueryFactory.createInstance.getCall(1);
      call.args[0].should.be.equal(locations[1].id);
      call.args[1].should.be.equal(dataset);
      call.args[2].should.be.equal(datatype);
      call.args[3].should.be.equal(probingStartYear);
      call.args[4].should.be.equal(probingStopYear);

    });

    it('when query done, query next location until all locations queried', function(){
      // arrange
      sinon.spy(dataQuery, 'run');
      var crawler = getInstance();

      // act
      crawler.run();
      for (var i = 0; i < locations.length; i++){
        simulateQueryCompleted(queryResult)
      }

      // assert
      assert.equal(dataQuery.run.callCount, locations.length);
    });

    it('write progress to console', function(){
      // arrange
      var crawler = getInstance();

      var calcProgress = function(index){
        return Math.round((index / locations.length) * 100 * 100) / 100
      };

      // act
      crawler.run();
      for (var i = 0; i < locations.length; i++){
        simulateQueryCompleted(queryResult)
      }

      // assert
      for (i = 0; i < locations.length; i++){
        //simulateQueryCompleted(queryResult)
        var progress = calcProgress(i + 1);
        console.log.calledWith('progress: ' + progress + '%').should.equal(true)
      }
    });

    it('not run more queries than specified in queryLimit', function(){
      // arrange
      sinon.spy(dataQuery, 'run');
      queryLimit = 2;

      var crawler = getInstance();

      // act
      crawler.run();
      for (var i = 0; i < locations.length; i++){
        simulateQueryCompleted(queryResult)
      }

      // assert
      assert.equal(dataQuery.run.callCount, queryLimit);
    });

    it('should use locationsOffset as start index', function(){
      // arrange
      locationsOffset = 1;
      var crawler = getInstance();

      // act
      crawler.run();
      simulateQueryCompleted(queryResult);

      // assert
      var call = dataQueryFactory.createInstance.getCall(0);
      call.args[0].should.be.equal(locations[locationsOffset].id);
    });

    it('should write results using resultsWriter when query completed', function(){
      // arrange
      datatype = "TEST";
      var expectedFilename = 'data/'+ dataset + '-' + datatype + '.json';

      var crawler = getInstance();

      // act
      crawler.run();
      simulateQueryCompleted(queryResult);

      // assert
      assert.equal(resultsWriter.write.calledOnce, true);

      var call = resultsWriter.write.getCall(0);
      call.args[0].should.be.equal(expectedFilename);
      call.args[1].should.be.equal(queryResult);
    });

    it('should log locations without data using resultsWriter', function(){
      // arrange
      datatype = "TEST";
      var expectedFilename = 'data/' +dataset + '-' + datatype + '-nodata.json';

      var crawler = getInstance();

      // act
      crawler.run();
      simulateQueryCompleted(null);

      // assert
      assert.equal(resultsWriter.write.calledOnce, true);

      var call = resultsWriter.write.getCall(0);
      call.args[0].should.be.equal(expectedFilename);
      call.args[1].should.be.equal(locations[0].id);
    });

    it('should pause at least one second before running next year', function(){
      // arrange

      var crawler = getInstance();

      // act
      crawler.run();
      simulateQueryCompleted(queryResult);

      // assert
      var call = timer.setTimeout.getCall(0);
      call.args[1].should.be.greaterThan(1000);
      timer.setTimeout.calledOnce.should.equal(true);
    });

  });

});

