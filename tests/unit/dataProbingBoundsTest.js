"use strict";
var should = require('should');
var sinon = require('sinon');
var assert = require('assert');
var DataProbingBounds = require('../../dataProbingBounds');

describe('dataProbingBounds', function(){

  function getInstance(stopYear){
    return new DataProbingBounds(stopYear ? stopYear : 2000);
  }

  describe('#constructor', function(){
    it('throw if stopYear not number', function(){
      // assert
      assert.throws(
        function(){
          new DataProbingBounds("not a number ok?");
        }, Error);
    })
  });

  describe('#getProbingBounds', function() {
    it('parameter should accept string that can be parsed as date', function(){
      // arrange
      var inputDate = '2015-01-01';
      var probingBounds = getInstance();

      // assert
      assert.doesNotThrow(function(){
        probingBounds.getProbingBounds(inputDate);
      });
    });

    it('parameter should throw exception if not Date', function(){
      // arrange
      var invalidDate = "this is not a date";

      var probingBounds = getInstance();

      // assert
      assert.throws(
        function(){
          probingBounds.getProbingBounds(invalidDate);
        }, Error);
    });

    it('return last year as startYear if parameter is a date of this year', function(){
      // arrange
      var inputDate = "2015-01-17";
      var expectedStartYear = 2014;

      var probingBounds = getInstance();

      // act
      var result = probingBounds.getProbingBounds(inputDate);

      // assert
      result.startYear.should.be.equal(expectedStartYear);
    });

    it('return the year of the input date when date not this year', function(){
      // arrange
      var inputDate = "2004-10-17";
      var expectedStartYear = 2004;
      var expectedStopYear = 2000;

      var probingBounds = getInstance(expectedStopYear);

      // act
      var result = probingBounds.getProbingBounds(inputDate);

      // assert
      result.startYear.should.be.equal(expectedStartYear);
    });

    it('stopYear should always be expectedStopYear', function(){
      // arrange
      var inputDate = "2015-01-17";
      var expectedStopYear = 2000;

      var probingBounds = getInstance(expectedStopYear);

      // act
      var result = probingBounds.getProbingBounds(inputDate);

      // assert
      result.stopYear.should.be.equal(expectedStopYear);
    });

    it('return last year if inputDate is less than stopYear', function(){
      // arrange
      var inputDate = "1999-10-23";
      var expectedStartYear = 2014;
      var expectedStopYear = 2000;

      var probingBounds = getInstance(expectedStopYear);

      // act
      var result = probingBounds.getProbingBounds(inputDate);

      // assert
      result.startYear.should.be.equal(expectedStartYear);
      result.stopYear.should.be.equal(expectedStopYear);
    });

  })
});