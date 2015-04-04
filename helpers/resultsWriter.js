"use strict";
var fs = require('fs');
var path = require('path');

exports.write = function(filename, data) {
  if(data === null){
    return;
  }

  console.log('writing results: ' + filename);
  fs.appendFileSync(filename, JSON.stringify(data) + '\r\n');
};