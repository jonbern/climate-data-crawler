"use strict";
var Timer = require('./helpers/timer');
var CdoProbingDataQuery = require('./cdoDataProbingQuery');
var CdoApiClient = require('./cdoApiClient');
var CdoApiClientFactory = require('./cdoApiClientFactory');

exports.createInstance = function(
  locationId, dataset, datatypeid, startYear, endYear){

  return new CdoProbingDataQuery(
    CdoApiClientFactory, new Timer(),
    locationId, dataset, datatypeid, startYear, endYear);

};