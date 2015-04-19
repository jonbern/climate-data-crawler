"use strict";
var CdoApiClient = require('./cdoApiClient');
var CdoApiClientFactory = require('./cdoApiClientFactory');
var Timer = require('./helpers/timer');

function CdoDataProbingQuery(
  cdoApiClientFactory, timer,
  locationId, dataset, datatypeid,  startYear, endYear) {

  var queryYear = startYear;
  var onQueryComplete;

  var onApiCallComplete = function(result){
    if (result){
      onQueryComplete(result);
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

  var queryNext = function(){
    var cdoApiClient = cdoApiClientFactory.createInstance(
      locationId, dataset, datatypeid,
      queryYear + '-01-01', queryYear + '-12-31');

    cdoApiClient.query(onApiCallComplete);
  };

  // privileged functions
  this.run = function(onQueryCompleteCallback){
    if (onQueryCompleteCallback){
      onQueryComplete = onQueryCompleteCallback;
    }
    else {
      onQueryComplete = function(){}
    }

    queryNext();
  }
}

CdoDataProbingQuery.createInstance = function(locationId, dataset, datatypeid, startYear, endYear){
  return new CdoDataProbingQuery(
    CdoApiClientFactory, new Timer(),
    locationId, dataset, datatypeid, startYear, endYear);
};

module.exports = CdoDataProbingQuery;