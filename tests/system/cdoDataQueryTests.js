"use strict";
var assert = require('assert');
var should = require('should');
var sinon = require('sinon');
var cdoDataQuery = require('../../cdoDataQuery');

describe('CdoDataQuery', function(){

  describe('#run', function(){

    it('should query OnRunCompleteCallback with results', function(done){
      // arrange
      this.timeout(120 * 1000);

      var brisbane = 'CITY:AS000002';
      var crawler = CdoDataQuery.createInstance(brisbane, 'GHCNDMS', 'MNTM', 2014);

      // act + assert
      crawler.run(function(result){
        console.log(result);
        result.should.not.be.null;
        done();
      });

    });

    it('should query OnrunCompleteCallback with results, even if location does not have recorded data for a long time (1983 max)', function(done){
      // arrange
      this.timeout(120 * 1000);

      var rioDeJaneiro = 'CITY:BR000023'; // 1988 is the most recent result in Rio de Janeiro
      var crawler = CdoDataQuery.createInstance(rioDeJaneiro, 'GHCNDMS', 'MNTM', 2014);

      // act + assert
      crawler.run(function(result){
        console.log(result);
        result.should.not.be.null;
        done();
      });
    });

  })
});
