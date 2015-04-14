"use strict";

var Timer = require('./helpers/timer');
var CdoDataProbingQuery = require('./cdoDataProbingQuery');
var cdoDataProbingQueryFactory = require('./cdoDataProbingQueryFactory');

function CdoDataCrawler(cdoDataQueryFactory, dataProbingBounds, timer,
                        dataset, datatype, locations, offset, count){
  var dataQuery;
  var queryLocationId;
  var index = 0;

  var resultsDelegate = function(){};
  var results = [];
  var locationsNoData = [];

  if (locations.length < count){
    count = locations.length;
  }

  // private functions
  var queryNext = function(){
    if (index < (locations.length - offset) && index < count) {
      var queryLocation = locations[index + offset];
      queryLocationId = queryLocation.id;
      var probingBounds =
        dataProbingBounds.getProbingBounds(queryLocation.maxdate);

      dataQuery = cdoDataQueryFactory.createInstance(queryLocationId,
        dataset, datatype, probingBounds.startYear, probingBounds.stopYear);

      dataQuery.run(onQueryComplete);

      index++;
    } else {
      resultsDelegate(results, locationsNoData);
    }
  };

  var onQueryComplete = function(queryResult){
    if (queryResult){
      results = results.concat(queryResult);
    } else {
      locationsNoData.push(queryLocationId);
    }

    reportProgress();

    timer.setTimeout(function(){
      queryNext();
    }, 2000);
  };

  var reportProgress = function(){
    var progress = Math.round((index / count) * 100 * 100) / 100;
    console.log('progress: ' + progress + '%');
  };

  // privileged functions
  this.run = function(resultsCallback){
    if (resultsCallback) {
      resultsDelegate = resultsCallback;
    }
    queryNext();
  }
}

CdoDataCrawler.createInstance = function(
  dataset, datatype, locations, dataProbingBounds,
  locationsOffset, queryLimit){

  return new CdoDataCrawler(
    cdoDataProbingQueryFactory, dataProbingBounds, new Timer(),
    dataset, datatype, locations, locationsOffset, queryLimit);
};

module.exports = CdoDataCrawler;