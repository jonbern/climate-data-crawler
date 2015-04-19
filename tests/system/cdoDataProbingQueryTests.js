"use strict";
var assert = require('assert');
var sinon = require('sinon');
var cdoDataProbingQuery = require('../../cdoDataProbingQuery');

describe('CdoDataProbingQuery', function(){

  describe('#run', function(){

    it('should query OnRunCompleteCallback with results', function(done){
      // arrange
      this.timeout(120 * 1000);

      var brisbane = 'CITY:AS000002';
      var query = cdoDataProbingQuery.createInstance(
        brisbane, 'GHCNDMS', 'MNTM', 2014, 2014);

      // act + assert
      query.run(function(result){
        console.log(result);
        assert.notEqual(result, null);
        done();
      });

    });

    it('should probe earlier years until endYear as long as there is no data returned from web service', function(done){
      // arrange
      this.timeout(120 * 1000);

      var rioDeJaneiro = 'CITY:BR000023'; // 1988 is the most recent result in Rio de Janeiro
      var query = cdoDataProbingQuery.createInstance(
        rioDeJaneiro, 'GHCNDMS', 'MNTM', 2014, 1980);

      // act + assert
      query.run(function(result){
        console.log(result);
        assert.notEqual(result, null);
        done();
      });
    });

  })
});
