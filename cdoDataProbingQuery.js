"use strict";
var CdoApiClient = require('./cdoApiClient');
var CdoApiClientFactory = require('./cdoApiClientFactory');
var Timer = require('./helpers/timer');

function CdoDataProbingQuery(
  cdoApiClientFactory, timer,
  locationId, dataset, datatypeid, startYear, endYear) {

  var queryYear = startYear;

  var onQueryComplete = function(){};
  var onError = function(){};

  var onApiCallComplete = function(results){
    if (results){
      onQueryComplete(appendLocationIdToResults(results));
    }
    else {
     queryYear--;
      if (queryYear >= endYear){
        timer.setTimeout(function(){
          queryNext()
        }, 1000);
      }
      else {
        onQueryComplete(null);
      }
    }
  };

  var appendLocationIdToResults = function(results){
    for (var i = 0; i < results.length; i++){
      results[i].locationId = locationId;
    }
    return results;
  };

  var queryNext = function(){
    var queryPath = generateQueryPath();
    var cdoApiClient = cdoApiClientFactory.createInstance(queryPath);
    cdoApiClient.query(onApiCallComplete, onError);
  };

  var generateQueryPath = function(){
    var startDate = queryYear + '-01-01';
    var endDate = queryYear + '-12-31';

    return '/cdo-web/api/v2/data?datasetid=' + dataset
          + '&locationid=' + locationId
          + '&startdate=' + startDate
          + '&enddate=' + endDate
          + '&datatypeid=' + datatypeid
          + '&limit=1000';
  };

  // privileged functions
  this.run = function(queryCompleteCallback, errorCallback){
    if (queryCompleteCallback)
      onQueryComplete = queryCompleteCallback;

    if (errorCallback)
      onError = errorCallback;

    queryNext();
  }
}

CdoDataProbingQuery.createInstance = function(locationId, dataset, datatypeid, startYear, endYear){
  return new CdoDataProbingQuery(
    CdoApiClientFactory, new Timer(),
    locationId, dataset, datatypeid, startYear, endYear);
};

module.exports = CdoDataProbingQuery;