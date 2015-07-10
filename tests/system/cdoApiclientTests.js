"use strict";
var assert = require('assert');
var sinon = require('sinon');
var CdoApiClient = require('../../cdoApiClient');

describe('CdoApiClient', function(){
  describe('#invoke', function(){

    it('should raise done event', function(done){
      // arrange
      this.timeout(120 * 1000);

      var locationId = 'CITY:BR000023';
      var dataset = 'GHCNDMS';
      var startDate = '1983-01-01';
      var endDate = '1983-12-31';
      var datatypeid = 'MNTM';

      var queryPath = '/cdo-web/api/v2/data?datasetid=' + dataset
        + '&locationid=' + locationId
        + '&startdate=' + startDate
        + '&enddate=' + endDate
        + '&datatypeid=' + datatypeid
        + '&limit=1000';

      var client = CdoApiClient.createInstance(queryPath);

      // act + assert
      client.query(function(result){
        console.log(result);
        assert.notEqual(result, null);
        done();
      });

    });

    it('should raise done event also when api only returns an empty object', function(done){
      // arrange
      this.timeout(120 * 1000);

      var locationId = 'CITY:BR000023';
      var dataset = 'GHCNDMS';
      var startDate = '1900-01-01';
      var endDate = '1900-12-31';
      var datatypeid = 'MNTM';

      var queryPath = '/cdo-web/api/v2/data?datasetid=' + dataset
        + '&locationid=' + locationId
        + '&startdate=' + startDate
        + '&enddate=' + endDate
        + '&datatypeid=' + datatypeid
        + '&limit=1000';

      var client = CdoApiClient.createInstance(queryPath);

      // act + assert
      client.query(function(result){
        assert.equal(result, null);
        done();
      });
    });

  })
});
