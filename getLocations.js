var fs = require('fs');
var CdoApiClient = require("./cdoApiClient")

var queryPath = '/cdo-web/api/v2/locations?locationcategoryid=city&sortfield=name&limit=1000'

var client = CdoApiClient.createInstance(queryPath);

client.query(function(result){
    fs.appendFileSync('./CITIES.json', JSON.stringify(result) + '\r\n');
    console.log('Done. File written.');
});
