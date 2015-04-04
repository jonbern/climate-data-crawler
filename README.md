# Climatic Data Crawler - CDO (Climate Data Online) data crawler
This project is an API and CLI you can use to easily query data
from [NCDC (National Climatic Date Center) CDO (Climate Data Online) web services v2](https://www.ncdc.noaa.gov/cdo-web/webservices/v2).

NCDC's CDO web services offer current- and historical climatic data from various datasets with data
from the US and around the world. The challenge these web services is that they are quite extensive and it
is difficult to navigate your way around and find out how to get the data you are looking for.

I created this project because I needed a way to query historical climate data for locations
 around the world and found the core CDO web services very impractical for this purpose. 

## CdoDataCrawler > CdoDataProbingQuery > CdoApiClient
The Climatic Data Crawler consists of three main components which let's you query the CDO web
services at a varying level of abstraction. 

### CdoDataCrawler
Implements the highest level of abstractions and will let you query a collection 
of locations and get the most recent (or specified by year) yearly climatic data available. You can
specify the dataset (for instance: GHCND or GHCNDMS) and datatype (for instance MMNT (Monthly Mean minimum temperature)) 
for the queries query. 

Results are written to disk (./data/<dataset>-<datatype>.json). Future versions will support a callback 
providing the results (similar to CdoDataProbingQuery and CdoApiClient)

The CdoDataCrawler is implemented using a CdoDataProbingQuery for each location it queries.

### CdoDataProbingQuery
Represents a data probing query against a single location and dataset/datatype within a specified probing interval (yearly).
It will return data from the most recent year which has data for the specified location and dataset/datatype. 

The CdoDataQuery object uses a CdoApiClient to interact with the CDO web services.

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

### Clone Climatic Data Crawler

Clone the Climatic Data Crawler repository using git:

```
git clone https://github.com/jonbernhardsen/climatic-data-crawler.git
cd climatic-data-crawler
```

### Install dependencies

Simply do: npm install

### Request CDO service token and create apitoken.txt:
To query the NCDC CDO Web Services you need a service token which can be requested here: [Request CDO web token](https://www.ncdc.noaa.gov/cdo-web/token).
You need to register with your e-mail address and afterwards you will be sent a unique token which you can use to access their web services.

Once you have a valid CDO service token, you need to create a apitoken.txt in the climatic-data-crawler directory and paste in your token. The 
Climatic Data Crawler uses this file to read your token so that you can query the CDO web services.

//## Climate Data Crawler npm package
//You can also install Climate Data Crawler as a npm dependency to your project. This is particulary useful if want to implement your own 
//crawler strategy, built on top of CdoProbingDataQuery calls or CdoApiClient directly. 

## How to use

### CdoDataCrawler
CLI example:
```
node app.js --dataset GHCNDMS --datatype MNTM --locations 'CITIES.json'  --probingStopYear 2010 --offset 0 --count 100
```




TODO!!! Talk about the locations file, the format and how to get one locations file





node.js example:
```
var fs = require('fs');
var CdoDataCrawler = require('./cdoDataCrawler');
var DataProbingBounds = require('./dataProbingBounds');

var dataset = 'GHCNDMS'; // Global Historical Climatology Network-Monthly
var datatype = 'MNTM'; // monthly mean temperature
var locations = 
  [
    {
      "id": "CITY:AS000002",
      "name": "Brisbane, AS",
      "datacoverage": 1,
      "mindate": "1841-07-01",
      "maxdate": "2015-02-03"
    },
    {
      "id": "CITY:NO000001",
      "name": "Bergen, NO",
      "datacoverage": 1,
      "mindate": "1938-01-01",
      "maxdate": "2015-03-04"
    }
  ];

var dataProbingStopYear = 2010;
var dataProbingBounds = new DataProbingBounds(dataProbingStopYear);
var locations = JSON.parse(fs.readFileSync(options.locations, 'utf8'));

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
TODO: Should make a createInstance method for the stuff below... too complicated now
```
var CdoApiClient = require('./cdoApiClient');
var Timer = require('./helpers/timer');
var HttpClient = require('./helpers/httpClient');
var Logger = require('./helpers/logger');
var events = require('events');
var timer = new Timer();

var apiClient =
    new CdoApiClient(new HttpClient(), new Logger(), new events.EventEmitter(), new Timer());
    
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

## Links
[NCDC Climate Data Online](https://www.ncdc.noaa.gov/cdo-web)
[Wikipedia: Global Historical Climatology Network](http://en.wikipedia.org/wiki/Global_Historical_Climatology_Network)
