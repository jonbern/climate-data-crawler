"use strict";
var fs = require('fs');
var Timer = require('./helpers/timer');

function CdoApiClient(httpClient, logger, timer, queryPath) {
  var queryResults;
  var onResults = function(){};
  var onError = function(){};

  function queryNext(offset) {
    if (!offset){
      offset = 1;
      queryResults = [];
    }

    var options = {
      host : 'www.ncdc.noaa.gov',
      path : queryPath + '&offset=' + offset,
      method : 'GET',
      headers: {'token': readApiToken()}
    };

    logger.info(options.path);

    httpClient.request(options, onRequestCompleted, onError);
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
        onResults(queryResults);
      }
      else {
        timer.setTimeout(function () {
          queryNext(nextRequestOffset);
        }, 1500);
      }
    }
    else {
      if (Object.keys(resultJson).length === 0){
        onResults(null);
      }
    }
  }

  // privileged functions
  this.query = function(resultCallback, errorCallback) {
    if (resultCallback)
      onResults = resultCallback;

    if (errorCallback)
      onError = errorCallback;

    queryNext();
  };
}

CdoApiClient.createInstance = function(queryPath, httpClient, logger, timer){
  var HttpClient = require('./helpers/httpClient');
  var Logger = require('./helpers/logger');

  return new CdoApiClient(
    httpClient ? httpClient : new HttpClient(),
    logger ? logger : new Logger(),
    timer ? timer : new Timer(),
    queryPath);
};

module.exports = CdoApiClient;
