"use strict";
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var assert = require('assert');

describe('getLocations', function() {

  var cdoApiClient;
  var cdoApiClientInstance;
  var fs;

  beforeEach(function() {
    cdoApiClientInstance = {
      query: sinon.stub()
    };

    cdoApiClient = {
      createInstance: sinon.stub().returns(cdoApiClientInstance)
    };

    fs = {
      appendFileSync: sinon.stub()
    };

    proxyquire('../../getLocations',
      {
        './cdoApiClient': cdoApiClient,
        'fs': fs
      }
    )
  });

  beforeEach(function() {
    require('../../getLocations');
  });

  it('invokes #createInstance using expected api path', function() {
    var expectedPath = '/cdo-web/api/v2/locations?locationcategoryid=city&sortfield=name&limit=1000';
    assert(cdoApiClient.createInstance.calledWith(expectedPath));
  });

  it('invokes #query on CdoApiClient', function() {
    assert(cdoApiClientInstance.query.calledWith(sinon.match.func));
  });

  describe('when query is finished', function() {

    var queryResult = { fakeResult: 'example' };

    beforeEach(function() {
      cdoApiClientInstance.query.yield(queryResult)
    });

    it('writes result to file', function() {
      assert(fs.appendFileSync.calledWith(
        './CITIES.json', JSON.stringify(queryResult) + '\r\n'));
    });
  });
});
