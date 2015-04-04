"use strict";
var CdoApiClient = require('./cdoApiClient');
var Timer = require('./helpers/timer');

function CdoDataProbingQuery(cdoApiClient, timer, params) {
  var queryYear = params.startYear;

  var apiParameters = {
    dataset: params.dataset,
    datatypeid: params.datatypeid,
    locationId: params.locationId,
    startDate: queryYear + '-01-01',
    endDate: queryYear + '-12-31'
  };

  // privileged functions
  this.run = function(onQueryCompleteCallback){
    if (!onQueryCompleteCallback) onQueryCompleteCallback = function(){};

    var onApiClientDone = function(result){
      if (result){
        onQueryCompleteCallback(result);
      }
      else {
        queryYear--;
        if (queryYear >= params.endYear){
          timer.setTimeout(function(){
            apiParameters.startDate = queryYear + '-01-01';
            apiParameters.endDate = queryYear + '-12-31';
            cdoApiClient.query(apiParameters);
          }, 1000);
        }
        else {
          onQueryCompleteCallback(null);
        }
      }
    };

    cdoApiClient.getEventEmitter().on('done', onApiClientDone);
    cdoApiClient.query(apiParameters);
  }
}

CdoDataProbingQuery.createInstance = function(
  locationId, dataset, datatypeid, startYear, endYear){
  var events = require('events');
  var eventEmitter = new events.EventEmitter();
  var timer = new Timer();

  var apiClient = CdoApiClient.createInstance(eventEmitter, timer);

  return new CdoDataProbingQuery(
    apiClient, timer, {
      locationId: locationId,
      dataset: dataset,
      datatypeid: datatypeid,
      startYear: startYear,
      endYear: endYear
    });
};

module.exports = CdoDataProbingQuery;