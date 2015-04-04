"use strict";
var Timer = require('./helpers/timer');
var CdoProbingDataQuery = require('./cdoDataProbingQuery');
var CdoApiClient = require('./cdoApiClient');

exports.createInstance = function(
  locationId, dataset, datatypeid, startYear, endYear){
  var events = require('events');
  var eventEmitter = new events.EventEmitter();
  var HttpClient = require('./helpers/httpClient');
  var Logger = require('./helpers/logger');
  var timer = new Timer();

  var apiClient =
    new CdoApiClient(new HttpClient(), new Logger(), eventEmitter, timer);

  return new CdoProbingDataQuery(
    apiClient, timer, {
      locationId: locationId,
      dataset: dataset,
      datatypeid: datatypeid,
      startYear: startYear,
      endYear: endYear
    });
};