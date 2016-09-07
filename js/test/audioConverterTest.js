var assert = require('assert');
var fs = require('fs');
var AudioConverter = require('../audioConverter');

describe('AudioConverter', function() {
    describe('#convert', function() {
        it("Correctly converts file to mp3", function(done) {
            var inputData  = fs.readFileSync('js/test/ContentPromoPrompt.m4a');
            AudioConverter.convert(inputData, function (data) {
                fs.writeFileSync('js/test/UnitTestOutput.mp3', data, {'encoding': null});
                assert.equal(data.length, 189140);
                done();
            });
        });
    });

    describe('#upload', function() {
        it("Uploads file to S3", function(done) {
            this.timeout(5000);
            var data = fs.readFileSync('js/test/UnitTestOutput.mp3');
            AudioConverter.upload('xapp-alexa', 'UnitTestOutput.mp3', data, function (url) {
                assert.equal(url, 'https://s3.amazonaws.com/xapp-alexa/UnitTestOutput.mp3');
                done();
            });
        });
    });

    describe('#convertAndUpload', function() {
        this.timeout(5000);
        it("Converts and uploads file to S3", function(done) {
            var data = fs.readFileSync('js/test/ContentPromoPrompt.m4a');
            AudioConverter.convertAndUpload('UnitTestUploaded.mp3', data, function (url) {
                assert.equal(url, 'https://s3.amazonaws.com/xapp-alexa/UnitTestUploaded.mp3');
                done();
            });
        });
    });
});


