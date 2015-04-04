# Climate Data Crawler - CDO (Climate Data Online) data crawler
This project is an API and CLI you can use to easily query data
from [NCDC (National Climatic Date Center) CDO (Climate Data Online) web services v2](https://www.ncdc.noaa.gov/cdo-web/webservices/v2).

NCDC's CDO web services offer current- and historical climatic data from various datasets with data
from the US and around the world. The challenge these web services is that they are quite extensive and it
is difficult to navigate your way around and find out how to get the data you are looking for.

I created this project because I needed a way to query historical climate data for locations
 around the world and found the core CDO web services very impractical for this purpose. 

## Components
The Climatic Data Crawler consists of three main components which lets you query the CDO web
services at a varying level of abstraction. 

### CdoDataCrawler
Implements the highest level of abstractions and will let you query a collection 
of locations and get the most recent (or specified by year) yearly climatic data available. You can
specify the dataset (for instance: GHCND or GHCNDMS) and datatype (for instance MMNT (Monthly Mean minimum temperature)) 
for the queries query. 

Results are written to disk (./data/<dataset>-<datatype>.json). Future versions will support a callback 
providing the results (similar to CdoDataProbingQuery and CdoApiClient)

### CdoDataProbingQuery
Represents a data probing query against a single location and dataset/datatype within a specified probing interval (yearly).
It will return data from the most recent year which has data for the specified location and dataset/datatype. 

### CdoApiClient
CdoApiClient represents the lowest level abstraction for querying CDO web services. CdoApiClient abstracts
away the CDO web services' data paging functionality, which makes it challenging to query large recordsets 
programmatically. The CdoApiClient will handle the paging for you and uses multiple requests to page through
the data and return the complete resultset to you.

## Getting started
To get you started you can simply clone the Climatic Data Crawler repository and install the dependencies.

### Prerequisites
You need git to clone the Climatic Data Crawler repository. You can get git from
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

### Request web service token:
To query the NCDC CDO Web Services you need a service token which can be requested here: [Request CDO web token](https://www.ncdc.noaa.gov/cdo-web/token).
You need to register with your e-mail address and afterwards you will be sent a unique token which you can use to access their web services.

### Create apitoken.txt
Once you have a valid CDO service token, you need to create a apitoken.txt in the climatic-data-crawler directory and paste in your token. The 
Climatic Data Crawler uses this file to read your token so that you can query the CDO web services.

### Run the crawler
Run the crawler, the example below will get the most recent data for the 100 first locations in CITIES.json using 2010 as 
data probing stop year. 
```
node app.js --dataset GHCNDMS --datatype MNTM --locations 'CITIES.json'  --probingStopYear 2010 --offset 0 --count 100
```

Use curl to get a list of locations to query. The example below will return the 1000 first cities in registered in CDO: 
```
curl -H "token:<your-token>" "http://www.ncdc.noaa.gov/cdo-web/api/v2/locations?locationcategoryid=city&sortfield=name&limit=1000"
```

## npm package
You can also install Climate Data Crawler as a npm package. 

```
npm install climate-data-crawler --save
```

This is particularly useful if you want to implement your own crawling strategy built on top of 
CdoProbingDataQuery or CdoApiClient. 

## Usage

### CdoDataCrawler
CLI:
```
node app.js --dataset GHCNDMS --datatype MNTM --locations 'CITIES.json'  --probingStopYear 2010 --offset 0 --count 100
```
This will get the most recent data for the 100 first locations in CITIES.json using 2010 as data probing stop year. 

JS:
```
var fs = require('fs');
var CdoDataCrawler = require('./cdoDataCrawler');
var DataProbingBounds = require('./dataProbingBounds');

var dataset = 'GHCNDMS'; // Global Historical Climatology Network-Monthly
var datatype = 'MNTM'; // monthly mean temperature
var locations = JSON.parse(fs.readFileSync('CITIES.json', 'utf8')); // locations to query

var dataProbingStopYear = 2010; // data probing stop year
var dataProbingBounds = new DataProbingBounds(dataProbingStopYear); // data probing algorithm

var crawler = CdoDataCrawler.createInstance(dataset, datatype, locations, dataProbingBounds, 0, 100);
crawler.run();
```

### CdoDataProbingQuery
```
var cdoDataQueryFactory = require('./cdoDataProbingQuery');

var startYear = 2014;
var stopYear = 2010;

// Query Brisbane in Australia for the most yearly and recent monthly mean temperature between 2014 and 2010 
var dataQuery = CdoDataProbingQuery.createInstance('CITY:AS000002', 'GHCNDMS', 'MNTM', startYear, stopYear);

dataQuery.run(function(queryResult){
    console.log(queryResult);
});

```

### CdoApiClient
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

### Example datasets and datatpyes
GHCND - Global Historical Climatology Network-Daily dataset:

* PRCP - Precipitation (tenths of mm)

GHCNDMS - Global Historical Climatology Network-Monthly dataset: 

* MNTM - monthly mean temperature
* MMNT - Monthly Mean minimum temperature'
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
