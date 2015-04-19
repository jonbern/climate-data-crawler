"use strict";
var CdoApiClient = require('./cdoApiClient');
var CdoApiClientFactory = require('./cdoApiClientFactory');

exports.createInstance = function(
  locationid, dataset, datatypeid, startDate, endDate){


  return CdoApiClient.createInstance(locationid, dataset, datatypeid, startDate, endDate)

};