var assert = require('assert');
var fs = require('fs');
var AudioConverter = require('../lib/audioConverter');

describe('AudioConverter', function() {
    describe('#convert', function() {
        it("Correctly converts m4a file to mp3", function(done) {
            var inputData  = fs.readFileSync('test/ContentPromoPrompt.m4a');
            AudioConverter.convert(inputData, 'm4a', function (data) {
                fs.writeFileSync('test/UnitTestOutput.mp3', data, {'encoding': null});
                assert.equal(data.length, 189140);
                done();
            });
        });

        it("Correctly converts mp3 file to mp3", function(done) {
            var inputData  = fs.readFileSync('test/UnitTestOutput.mp3');
            AudioConverter.convert(inputData, 'mp3', function (data) {
                fs.writeFileSync('test/UnitTestOutput.mp3', data, {'encoding': null});
                assert.equal(data.length, 189356);
                done();
            });
        });

        it("Correctly converts mp3 file to mp3", function(done) {
            var inputData  = fs.readFileSync('test/iHeartRadio-Intro.mp3');
            AudioConverter.convert(inputData, 'mp3', function (data) {
                fs.writeFileSync('test/iHeartRadio-Intro-output.mp3', data, {'encoding': null});
                assert.equal(data.length, 22172);
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

        it("Downloads a problem file", function(done) {
            this.timeout(5000);
            AudioConverter.download('https://s3.amazonaws.com/xapp-alexa/JPKUnitTest-JPKUnitTest-1645-TAKEMETOWALMART-TRAILING.mp3', function (data) {
                assert.equal(data.length, 21956);
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
        let start = new Date().getTime();

        it("Converts and uploads file to S3", function(done) {
            AudioConverter.convertAndUpload('UnitTestUploaded.mp3',
                'https://d2mxb5cuq6ityb.cloudfront.net/ContentPromoPrompt-d77c8cac-de94-4c5b-8014-34c65beb0cc1.m4a',
                function (url) {
                    console.log("TIME: " + (new Date().getTime() - start));
                    assert.equal(url, 'https://s3.amazonaws.com/bespoken/streaming/UnitTestUploaded.mp3');
                    done();
                }
            );
        });

        it("Converts and caches file to S3", function(done) {
            let start = new Date().getTime();
            AudioConverter.convertAndUpload('UnitTestUploaded.mp3',
                'https://d2mxb5cuq6ityb.cloudfront.net/ContentPromoPrompt-d77c8cac-de94-4c5b-8014-34c65beb0cc1.m4a',
                function (url) {
                    var time = new Date().getTime() - start;
                    assert(time < 5);
                    done();
                }
            );
        });

        it("Converts and uploads mp3 file to S3", function(done) {
            AudioConverter.convertAndUpload('UnitTestUploaded2.mp3',
                'https://s3.amazonaws.com/xapp-alexa/JPKUnitTest-JPKUnitTest-1645-TAKEMETOWALMART-TRAILING.mp3',
                function (url) {
                    console.log("TIME: " + (new Date().getTime() - start));
                    assert.equal(url, 'https://s3.amazonaws.com/bespoken/streaming/UnitTestUploaded2.mp3');
                    done();
                }
            );
        });
    });
});


