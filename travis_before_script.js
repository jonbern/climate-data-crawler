"use strict";
var fs = require('fs');
fs.writeFileSync('apitoken.txt', process.env.API_TOKEN);