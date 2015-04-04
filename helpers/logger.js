"use strict";

function Logger(){

  this.error = function(message){
    throw message;
  };

  this.info = function(message){
    console.log(message);
  };
}

module.exports = Logger;