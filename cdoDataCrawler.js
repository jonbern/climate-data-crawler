"use strict";
var resultsWriter = require('./helpers/resultsWriter.js');
var Timer = require('./helpers/timer');
var CdoDataQuery = require('./cdoDataQuery');
var cdoDataQueryFactory = require('./cdoDataQueryFactory');

function CdoDataCrawler(cdoDataQueryFactory, dataProbingBounds, resultsWriter, timer,
                        dataset, datatype, locations, offset, count){
  var dataQuery;
  var queryLocationId;
  var index = offset;

  if (locations.length < count){
    count = locations.length;
  }

  // private functions
  var queryNext = function(){
    if (index < locations.length && index < count) {
      var queryLocation = locations[index];
      queryLocationId = queryLocation.id;
      var probingBounds =
        dataProbingBounds.getProbingBounds(queryLocation.maxdate);

      dataQuery = cdoDataQueryFactory.createInstance(queryLocationId,
        dataset, datatype, probingBounds.startYear, probingBounds.stopYear);

      dataQuery.run(onQueryComplete);
      console.log("crawl index: " + index);
      index++;
    }
  };

  var onQueryComplete = function(queryResult){
    if (!queryResult){
      console.log("no data. logging location: " + queryLocationId);
      resultsWriter.write('data/' + dataset + '-' + datatype + '-nodata.json', queryLocationId);
    }
    else {
      resultsWriter.write('data/' + dataset + '-' + datatype + '.json', queryResult);
    }

    var progress = Math.round((index / count) * 100 * 100) / 100;
    console.log('progress: ' + progress + '%');

    timer.setTimeout(function(){
      queryNext();
    }, 2000);
  };

  // privileged functions
  this.run = function(){
    queryNext();
  }
}

CdoDataCrawler.createInstance = function(
  dataset, datatype, locations, dataProbingBounds,
  locationsOffset, queryLimit){

  return new CdoDataCrawler(
    cdoDataQueryFactory, dataProbingBounds, resultsWriter, new Timer(),
    dataset, datatype, locations, locationsOffset, queryLimit);
};

module.exports = CdoDataCrawler;