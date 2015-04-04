"use strict";
var should = require('should');
var sinon = require('sinon');
var writer = require('../../helpers/resultsWriter');
var fs = require('fs');

describe("FileWriter", function(){

  afterEach(function(){
    if (typeof fs.appendFileSync.restore == 'function'){
      fs.appendFileSync.restore();
    }
    if (typeof console.log.restore == 'function'){
      console.log.restore();
    }
    if (typeof writer.write.restore == 'function'){
      writer.write.restore();
    }
  });

  describe("#write", function() {

    it('should write data to disk', function(){
      // arrange
      var data = ['1', '2', '3'];
      var spy = sinon.stub(fs, 'appendFileSync');

      // act
      writer.write('fileName', data);

      // assert
      var secondArgument = JSON.stringify(data);
      secondArgument.should.be.equal(JSON.stringify(data));
    });

    it('should use datatypeid as filename with json as extension', function(){
      // arrange
      var spy = sinon.stub(fs, 'appendFileSync');
      var fileName = "OKAY.json";

      // act
      writer.write(fileName, ['1', '2', '3']);

      // assert
      var firstArgument = spy.getCall(0).args[0];
      firstArgument.should.be.equal(fileName);
    });

    it('should also write to file if data is empty', function() {
      // arrange
      var spy = sinon.stub(fs, 'appendFileSync');
      sinon.spy(console, 'log');
      var emptyObject = {};

      // act
      writer.write('fileName', emptyObject);

      // assert
      spy.callCount.should.be.equal(1);
    });

    it('should not write to file if data is null', function() {
      // arrange
      var spy = sinon.stub(fs, 'appendFileSync');
      sinon.spy(console, 'log');

      // act
      writer.write('fileName', null);

      // assert
      spy.callCount.should.be.equal(0);
    });

    it('should write to console (with filename) if data is not empty', function(){
      // arrange
      sinon.stub(fs, 'appendFileSync');
      var data = { results: ['1', '2', '3']};
      var spy = sinon.spy(console, 'log');
      var fileName = "MNTN.json";

      // act
      writer.write(fileName, data);

      // assert
      spy.callCount.should.be.equal(1);
      var firstArgument = spy.getCall(0).args[0];
      firstArgument.should.be.equal('writing results: ' + fileName);
    });
  })

});