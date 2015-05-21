"use strict";
var fs = require('fs');
var cliArgs = require('command-line-args');
var readlineSync = require('readline-sync');
var CdoDataCrawler = require('./cdoDataCrawler');
var DataProbingBounds = require('./dataProbingBounds');
var resultsWriter = require('./helpers/resultsWriter.js');

var cli = cliArgs([
  { name: "dataset", type: String, alias: 's', description: "NOAA CDO climate dataset" },
  { name: "datatype", type: String, alias: 't', description: "dataset datatype to query" },
  { name: "locations", type: String, alias: 'l', description: "path to locations file with locations to crawl" },
  { name: "probingStopYear", type: Number, alias: 'y', description: "data probing stop year", value: 2000 },
  { name: "offset", type: Number, alias: 'o', description: "locations array offset", value: 0 },
  { name: "count", type: Number, alias: 'c', description: "number of locations to query", value: 500 }
]);

var options = cli.parse();

var argNotGiven = function(argument){
  return typeof argument == 'undefined';
};

if (argNotGiven(options.datatype) || argNotGiven(options.locations) || argNotGiven(options.locations)){
  console.log(cli.getUsage());
  process.exit(1);
}

var dataProbingBounds = new DataProbingBounds(options.probingStopYear);

var locations = JSON.parse(fs.readFileSync(options.locations, 'utf8'));
locations = locations.filter(function(location){
  return (new Date(location.maxdate).getFullYear()) >= options.probingStopYear;
});

var successCallback = function(results, locationsNoData){
  var filenameBase = options.dataset + '-' + options.datatype + '-offset-'
    + options.offset + '-count-' + options.count;

  resultsWriter.write('data/' + filenameBase + '.json', results);
  resultsWriter.write('data/' + filenameBase + '_nodata.json', locationsNoData);
};

var errorCallback = function(error){
  console.log("Error: " + error);

  var result = readlineSync.question('Do you want to retry? [y/n] :');
  if (result.toLowerCase() === 'y'){
    crawler.continue();
  }
};

var crawler = CdoDataCrawler.createInstance(
  options.dataset, options.datatype, locations, dataProbingBounds,
  options.offset, options.count);

crawler.run(successCallback, errorCallback);

