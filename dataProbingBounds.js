"use strict";
function DataProbingBounds(stopYear){

  if (isNaN(stopYear)){
    throw new Error('stopYear must provided and must be a number');
  }

  // privileged functions
  this.getProbingBounds = function(latestClimateDate){
    var inputDate = new Date(Date.parse(latestClimateDate));
    if (isNaN(inputDate)){
      throw new Error('parameter cannot be parsed as an date object');
    }

    var startYear;

    var currentTime = new Date();
    var currentYear = currentTime.getFullYear();

    var inputDateYear = inputDate.getFullYear();

    if (inputDateYear === currentYear || inputDateYear < stopYear){
      startYear = --currentYear;
    }
    else {
      startYear = inputDate.getFullYear();
    }

    return {
      startYear: startYear,
      stopYear: stopYear
    };
  }

}

module.exports = DataProbingBounds;
