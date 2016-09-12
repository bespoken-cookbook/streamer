var assert = require('assert');
var fs = require('fs');
var AudioConverter = require('../audioConverter');

describe('AudioConverter', function() {
    describe('#convert', function() {
        it("Correctly converts file to mp3", function(done) {
            var inputData  = fs.readFileSync('test/ContentPromoPrompt.m4a');
            AudioConverter.convert(inputData, function (data) {
                fs.writeFileSync('test/UnitTestOutput.mp3', data, {'encoding': null});
                assert.equal(data.length, 189140);
                done();
            });
        });
    });

    describe('#download', function() {
        it("Downloads file", function(done) {
            this.timeout(5000);
            AudioConverter.download('https://d2mxb5cuq6ityb.cloudfront.net/ContentPromoPrompt-d77c8cac-de94-4c5b-8014-34c65beb0cc1.m4a', function (data) {
                assert.equal(data.length, 607027);
                done();
            });
        });
    });

    describe('#upload', function() {
        it("Uploads file to S3", function(done) {
            this.timeout(10000);
            var data = fs.readFileSync('test/UnitTestOutput.mp3');
            AudioConverter.upload('xapp-alexa', 'UnitTestOutput.mp3', data, function (url) {
                assert.equal(url, 'https://s3.amazonaws.com/xapp-alexa/UnitTestOutput.mp3');
                done();
            });
        });
    });

    describe('#convertAndUpload', function() {
        this.timeout(10000);
        it("Converts and uploads file to S3", function(done) {
            AudioConverter.convertAndUpload('UnitTestUploaded.mp3',
                'https://d2mxb5cuq6ityb.cloudfront.net/ContentPromoPrompt-d77c8cac-de94-4c5b-8014-34c65beb0cc1.m4a',
                function (url) {
                    assert.equal(url, 'https://s3.amazonaws.com/xapp-alexa/UnitTestUploaded.mp3');
                    done();
                }
            );
        });
    });
});


