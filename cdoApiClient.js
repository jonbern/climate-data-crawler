"use strict";
var fs = require('fs');
var Timer = require('./helpers/timer');

function CdoApiClient(httpClient, logger, eventEmitter, timer) {
  var apiQueryPath;
  var queryResults;

  function makeRequest(offset) {
    if(offset === 1){
      queryResults = [];
    }

    var apiToken = readApiToken();

    var options = {
      host : 'www.ncdc.noaa.gov',
      port : 80,
      path : apiQueryPath + '&offset=' + offset,
      method : 'GET',
      headers: {'token': apiToken}
    };

    logger.info(options.path);
    httpClient.request(options, onRequestCompleted, function(error) {
      logger.error(error);
    });
  }

  function readApiToken(){
    try {
      return fs.readFileSync('apitoken.txt', 'utf8');
    } catch (e){
      logger.info('Please make sure there is an apitoken.txt file (containing your API token) in the executing directory.');
      logger.error(e);
    }
  }

  function onRequestCompleted(result){
    var resultJson = JSON.parse(result);
    queryResults = queryResults.concat(resultJson.results);

    if (resultJson.metadata){
      var resultset = resultJson.metadata.resultset;
      var nextRequestOffset = resultset.offset + resultset.limit;

      if (nextRequestOffset > resultset.count) {
        eventEmitter.emit('done', queryResults);
      }
      else {
        timer.setTimeout(function () {
          makeRequest(nextRequestOffset);
        }, 1500);
      }
    }
    else {
      if (Object.keys(resultJson).length === 0){
        eventEmitter.emit('done', null);
      }
    }
  }

  // privileged functions
  this.query = function(queryParams, offset) {
    apiQueryPath =
      '/cdo-web/api/v2/data?datasetid=' + queryParams.dataset
      + '&locationid=' + queryParams.locationId
      + '&startdate=' + queryParams.startDate
      + '&enddate=' + queryParams.endDate
      + '&datatypeid=' + queryParams.datatypeid
      + '&limit=1000';

    makeRequest(offset ? offset : 1);
  };

  this.getEventEmitter = function(){
    return eventEmitter;
  };
}

CdoApiClient.createInstance = function(eventEmitter, timer){
  var events = require('events');
  var HttpClient = require('./helpers/httpClient');
  var Logger = require('./helpers/logger');

  return new CdoApiClient(
    new HttpClient(), new Logger(),
    eventEmitter ? eventEmitter : new events.EventEmitter(),
    timer ? timer : new Timer());
};

module.exports = CdoApiClient;
