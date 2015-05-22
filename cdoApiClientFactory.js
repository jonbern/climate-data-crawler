"use strict";
var CdoApiClient = require('./cdoApiClient');

exports.createInstance = function(
  locationid, dataset, datatypeid, startDate, endDate){

  return CdoApiClient.createInstance(locationid, dataset, datatypeid, startDate, endDate)
};