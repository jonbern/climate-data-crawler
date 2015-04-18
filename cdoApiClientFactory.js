"use strict";
var CdoApiClient = require('./cdoApiClient');

exports.createInstance = function(
  dataset, datatypeid, locationid, startDate, endDate){
  //var events = require('events');
  //var eventEmitter = new events.EventEmitter();
  //var HttpClient = require('./helpers/httpClient');
  //var Logger = require('./helpers/logger');
  //var timer = new Timer();


  return CdoApiClient.createInstance(dataset, datatypeid, locationid, startDate, endDate);

  //var apiClient =
  //  new CdoApiClient(new HttpClient(), new Logger(), eventEmitter, timer);
  //
  //return new CdoApiClient(
  //  apiClient, timer, {
  //    locationId: locationId,
  //    dataset: dataset,
  //    datatypeid: datatypeid,
  //    startYear: startYear,
  //    endYear: endYear
  //  });
};