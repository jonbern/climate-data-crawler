"use strict";
var CdoApiClient = require('./cdoApiClient');
var Timer = require('./helpers/timer');

function CdoDataQuery(ngdcApiClient, timer, params) {
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
            ngdcApiClient.query(apiParameters);
          }, 1000);
        }
        else {
          onQueryCompleteCallback(null);
        }
      }
    };

    ngdcApiClient.getEventEmitter().on('done', onApiClientDone);
    ngdcApiClient.query(apiParameters);
  }
}

CdoDataQuery.createInstance = function(
  locationId, dataset, datatypeid, startYear, endYear){
  var events = require('events');
  var eventEmitter = new events.EventEmitter();
  var HttpClient = require('./helpers/httpClient');
  var Logger = require('./helpers/logger');
  var timer = new Timer();

  var apiClient =
    new CdoApiClient(new HttpClient(), new Logger(), eventEmitter, timer);

  return new CdoDataQuery(
    apiClient, timer, {
      locationId: locationId,
      dataset: dataset,
      datatypeid: datatypeid,
      startYear: startYear,
      endYear: endYear
    });
};

module.exports = CdoDataQuery;