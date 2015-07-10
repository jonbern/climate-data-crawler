"use strict";
var http = require("http");

function HttpClient(){

  this.request = function(options, successCallback, errorCallback){
    var request = http.request(options, function(response) {
      if (response.statusCode != 200){
        console.log(response.statusCode);
        if (errorCallback){
          errorCallback('Http status code: '
            + response.statusCode + ': ' + response.statusMessage);
        }
      }

      var body = '';
      response.on('data', function(d) {
        body += d;
      });
      response.on('end', function(){
        successCallback(body);
      });
    });

    request.on('socket', function (socket) {
      socket.setTimeout(600000);
      socket.on('timeout', function() {
        request.abort();
      });
    });

    request.on('error', function(error){
      if (errorCallback){
        errorCallback(error.message);
      }
    });

    request.end();
  };
}

module.exports = HttpClient;