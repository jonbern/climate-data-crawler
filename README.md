# Climate Data Crawler - CDO (Climate Data Online) data crawler
Climate Data Crawler is a library and node.js CLI (Command Line Interface) for querying 
[NCDC's (National Climatic Date Center) CDO (Climate Data Online) web services v2](https://www.ncdc.noaa.gov/cdo-web/webservices/v2) 
at a higher level of abstraction.

NCDC's CDO web services offer current- and historical climatic data from various data sets with data
from the US and around the world. The challenge with these web services is that they are very extensive 
and it is hard to find out how to get the data you need. I created this crawler because I needed a 
way to query a lot of data and felt that using the CDO web services directly was impractical. 

## Components
Climate Data Crawler consists of three main components which lets you query CDO web
services at varying levels of abstraction. 

### CdoDataCrawler
Implements the highest level of abstractions and will let you query a collection 
of locations and get the most recent (or specified by year) yearly climate data available. You can
specify the data set (for instance: `GHCND` or `GHCNDMS`) and datatype (for instance `MMNT` (monthly mean minimum temperature)) 
for the queries. 

### CdoDataProbingQuery
Represents a data probing query against a single location and data set/data type within a specified probing interval (yearly).
It will return data from the most recent year which has data for the specified location and data set/data type. 

### CdoApiClient
CdoApiClient represents the lowest level of abstraction for querying CDO web services. CdoApiClient abstracts
away the data paging behavior of the CDO web services, which makes it challenging to query large record sets 
programmatically. The CdoApiClient handles the paging for you by using multiple requests to page through
 data and return the complete result set when finished.

## Getting started

### Prerequisites
You need git to clone the Climate Data Crawler repository. You can get git from
[http://git-scm.com/](http://git-scm.com/).

You also need node.js and its package manager (npm) installed. You can get them from: [http://nodejs.org/](http://nodejs.org/).

### Clone Clima Data Crawler repository

Clone the Climate Data Crawler repository using git:

```
git clone https://github.com/jonbern/climate-data-crawler.git
cd climate-data-crawler
```

### Install dependencies

Install npm dependencies
```
npm install
```

### CDO web service token:
To query the NCDC CDO Web Services you need a web service token which can be requested here: [Request CDO web token](https://www.ncdc.noaa.gov/cdo-web/token).
You need to register with your e-mail address and afterwards you will be sent a unique token which you can use to access the web services.

### apitoken.txt
Once you have a valid CDO service token, you need to create an apitoken.txt file in the climate-data-crawler directory and paste in your token. 
Climate Data Crawler uses this file to read your token so that you can query the CDO web services.

### Run the crawler
The example below will get the most recent data for the 100 first locations in CITIES.json using 2010 as 
data probing stop year. 
```
node app.js --dataset GHCNDMS --datatype MNTM --locations 'CITIES.json'  --probingStopYear 2010 --offset 0 --count 100
```
The example above makes the assumption you have a 'CITIES.json' file in your climate-data-crawler directory. 

Use curl to get a list of locations to query. The example below will return the 1000 first cities in CDO: 
```
curl -H "token:<your-token>" "http://www.ncdc.noaa.gov/cdo-web/api/v2/locations?locationcategoryid=city&sortfield=name&limit=1000"
```

## npm package
You can also install Climate Data Crawler as a npm package. 

```
npm install climate-data-crawler --save
```
This is particularly useful if you need to incorporate Climate Data Crawler into your own project, for instance if you need to build
custom crawling strategies built on top of CdoDataProbingQuery or CdoApiClient.

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
var CdoDataCrawler = require('./cdoDataCrawler');
var DataProbingBounds = require('./dataProbingBounds');

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
var cdoDataQueryFactory = require('./cdoDataProbingQuery');

var startYear = 2014;
var stopYear = 2010;

var dataQuery = CdoDataProbingQuery.createInstance('CITY:AS000002', 'GHCNDMS', 'MNTM', startYear, stopYear);

dataQuery.run(function(queryResult){
    console.log(queryResult);
});

```

### CdoApiClient
Use the CdoApiClient to get Brisbane's monthly mean temperatures between 01 January 2014 and 31 December 2014:
```
var CdoApiClient = require('./cdoApiClient');
var events = require('events');

var apiClient = CdoApiClient.createInstance();
    
var parameters = {
  dataset: 'GHCNDMS',
  datatypeid: 'MNTM',
  locationId: CITY:AS000002,
  startDate: '2014-01-01',
  endDate: '2014-12-31'
};
  
ngdcApiClient.getEventEmitter().on('done', function(result){
 console.log(result);
});

ngdcApiClient.query(parameters);
```

## Resources

### Example data sets and data types
GHCND - Global Historical Climatology Network-Daily data set:

* PRCP - Precipitation (tenths of mm)

GHCNDMS - Global Historical Climatology Network-Monthly data set: 

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

[Wikipedia: Global Historical Climatology Network](http://en.wikipedia.org/wiki/Global_Historical_Climatology_Network)
