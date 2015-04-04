"use strict";

function Timer() {
  this.setTimeout = function(callback, delay){
    setTimeout(callback, delay);
  };
}

module.exports = Timer;