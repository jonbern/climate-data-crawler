var fs = require('fs');
var cdoApiClient = require("./cdoApiClient")

function getLocations() {
  var queryPath = '/cdo-web/api/v2/locations?locationcategoryid=city&sortfield=name&limit=1000'
  var client = cdoApiClient.createInstance(queryPath);

  client.query(function(result) {
    fs.appendFileSync('./CITIES.json', JSON.stringify(result) + '\r\n');
    console.log('Done. CITIES.json written.');
  });
};

getLocations();

module.exports.getLocations;
