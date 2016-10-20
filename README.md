[![Build Status](https://travis-ci.org/jonbern/climate-data-crawler.svg?branch=master)](https://travis-ci.org/jonbern/climate-data-crawler)

# Climate Data Crawler - CDO (Climate Data Online) data crawler
Climate Data Crawler is a node.js library and CLI (Command Line Interface) for querying
[NCDC's (National Climatic Data Center) CDO (Climate Data Online) web services v2](https://www.ncdc.noaa.gov/cdo-web/webservices/v2)
at different levels of abstraction.

NCDC's CDO web services offer current- and historical climatic data from data sets with data
from the US and the rest of the world. Using a basic REST client to query these web services is fine as long as you only
need some data, but when you need to query a lot of data or many locations, it quickly becomes a time consuming and
challenging task. This is where Climate Data Crawler helps; It allows you to easily setup queries and to run queries for
multiple locations.

## Components
Climate Data Crawler consists of three main components.

### CdoDataCrawler
Implements the highest level of abstractions and will let you query a collection
of locations and get the most recent (or specified by year) yearly climate data available. You can
specify the data set (for instance: `GHCND` or `GHCNDMS`) and datatype (for instance `MMNT` (monthly mean minimum temperature))
for the queries.

### CdoDataProbingQuery
Represents a data probing query against a single location and data set/data type within a specified probing interval (yearly).
It will return data from the most recent year which has data for the specified location and data set/data type.

It also tags all data records with the corresponding locationId to make it easier to create aggregated results
 based on locationIds and not only stationIds.

### CdoApiClient
CdoApiClient represents the lowest level of abstraction for querying CDO web services and is also the method which gives the
most flexibility. You can basically query anything from the CDO web services using the CdoApiClient; It abstracts
away the data paging behavior of the CDO web services, which makes it easy to query large data sets.

## Getting started

### Prerequisites
You need git to clone the Climate Data Crawler repository. You can get git from
[http://git-scm.com/](http://git-scm.com/).

You also need node.js and its package manager (npm) installed. You can download node.js (including npm) from: [http://nodejs.org/](http://nodejs.org/).

### Clone Climate Data Crawler repository

Clone the Climate Data Crawler repository using git:

```
git clone https://github.com/jonbern/climate-data-crawler.git
cd climate-data-crawler
```

### Install dependencies

Install npm dependencies by running the command below:
```
npm install
```

### CDO web service token:
To query the NCDC CDO Web Services you need a web service token which can be requested here: [Request CDO web token](https://www.ncdc.noaa.gov/cdo-web/token).
You need to register with your e-mail address and afterwards you will be sent a unique token which you can use to access the web services.

### apitoken.txt
Once you have a valid CDO service token, you need to create an apitoken.txt file in the climate-data-crawler directory and paste in your token.
Climate Data Crawler uses this file to read your token so that you can query the CDO web services.

### Download a list of locations to query
Run the following command:
```
node getLocations.js
```
This will retrieve all locations classified as cities and store the result in a file called CITIES.json.
You can edit the query used in getLocations.js to query a different set of locations if desired.

### Run the crawler
The example below will get the most recent data for the 100 first locations in CITIES.json using 2010 as
data probing stop year.
```
node app.js --dataset GHCNDMS --datatype MNTM --locations 'CITIES.json'  --probingStopYear 2010 --offset 0 --count 100
```
The example above makes the assumption you have a 'CITIES.json' file in your climate-data-crawler directory.

Results will be stored in ./data.

## npm package
You can also install Climate Data Crawler as a npm package.

```
npm install climate-data-crawler --save
```
This is particularly useful if you need to incorporate Climate Data Crawler into your own project, for instance if you want to build
custom crawling strategies built on top of CdoDataProbingQuery or using CdoApiClient to create custom queries.

## Usage

### CdoDataCrawler
CLI:
```
node app.js --dataset GHCNDMS --datatype MNTM --locations 'CITIES.json'  --probingStopYear 2010 --offset 0 --count 100
```
This will get the most recent MNTM data for the 100 first locations in CITIES.json using 2010 as data probing stop year.

Using the CLI, results will automatically be stored to disk (./data folder).

JS:
```
var fs = require('fs');
var CdoDataCrawler = require('climate-data-crawler/cdoDataCrawler');
var DataProbingBounds = require('climate-data-crawler/dataProbingBounds');

var dataset = 'GHCNDMS'; // Global Historical Climatology Network-Monthly
var datatype = 'MNTM'; // monthly mean temperature
var locations = JSON.parse(fs.readFileSync('CITIES.json', 'utf8')); // locations to query

var dataProbingStopYear = 2010; // data probing stop year
var dataProbingBounds = new DataProbingBounds(dataProbingStopYear); // data probing bounds algorithm

var crawler = CdoDataCrawler.createInstance(dataset, datatype, locations, dataProbingBounds, 0, 100);

crawler.run(function(results, locationsNoData){
    // do something with the results and log which locations returned no data
});
```

### CdoDataProbingQuery
This example will query the Brisbane location for the most recent monthly mean temperatures between 2014 and 2010:
```
var cdoDataQueryFactory = require('climate-data-crawler/cdoDataProbingQuery');

var startYear = 2014;
var stopYear = 2010;

var dataQuery = CdoDataProbingQuery.createInstance('CITY:AS000002', 'GHCNDMS', 'MNTM', startYear, stopYear);

dataQuery.run(function(queryResult){
    console.log(queryResult);
});

```

### CdoApiClient
Get Brisbane's monthly mean temperatures between 01 January 2014 and 31 December 2014:
```
var CdoApiClient = require('climate-data-crawler/cdoApiClient');

var locationId = 'CITY:AS000002';
var dataset = 'GHCNDMS';
var startDate = '2014-01-01';
var endDate = '2014-12-31';
var datatypeid = 'MNTM';

var queryPath = '/cdo-web/api/v2/data?datasetid=' + dataset
+ '&locationid=' + locationId
+ '&startdate=' + startDate
+ '&enddate=' + endDate
+ '&datatypeid=' + datatypeid
+ '&limit=1000';

var client = CdoApiClient.createInstance(queryPath);

client.query(function(result){
    console.log(result);
});
```

Retrieve details of all registered stations:
```
var fs = require('fs');
var CdoApiClient = require('climate-data-crawler/cdoApiClient');

var queryPath = '/cdo-web/api/v2/stations?limit=1000';
var client = CdoApiClient.createInstance(queryPath);

client.query(function(result){
  console.log(result);
  fs.appendFileSync('./stations.json', JSON.stringify(result) + '\r\n');
});
```
## Error handling

All three components have support for defining an error callback to handle errors.
```
...

var errorCallback = function(error){
    // your error handling here
}

crawler.run(successCallback, errorCallback);
```

## Resources

### Example data sets and data types
GHCND - Global Historical Climatology Network-Daily data set:

* PRCP - Precipitation (tenths of mm)

GHCNDMS - Global Historical Climatology Network-Monthly Summaries data set:

* MNTM - Monthly mean temperature
* MMNT - Monthly Mean minimum temperature
* MMXT - Monthly Mean maximum temperature
* TPCP - Total precipitation

### Example location IDs
* CITY:AS000002 - Brisbane, Australia
* CITY:NO000001 - Bergen, Norway
* CITY:BR000028 - Sao Paulo, Brazil
* CITY:BR000023 - Rio de Janeiro, Brazil

### Links
[NCDC Climate Data Online](https://www.ncdc.noaa.gov/cdo-web)

[NCDC's (National Climatic Data Center) CDO (Climate Data Online) web services v2](https://www.ncdc.noaa.gov/cdo-web/webservices/v2)

[Wikipedia: Global Historical Climatology Network](http://en.wikipedia.org/wiki/Global_Historical_Climatology_Network)

[GHCND Global Historical Climatology Network)-Monthly Summaries documentation](http://www1.ncdc.noaa.gov/pub/data/cdo/documentation/GHCNDMS_documentation.pdf)
