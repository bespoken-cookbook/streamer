var assert = require('assert');
var fs = require('fs');
var AudioConverter = require('../lib/audioConverter');

describe('AudioConverter', function() {
    describe('#convertAndUpload', function() {
        this.timeout(10000);
        var start = new Date().getTime();

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
            var start = new Date().getTime();
            AudioConverter.convertAndUpload('UnitTestUploaded.mp3',
                'https://d2mxb5cuq6ityb.cloudfront.net/ContentPromoPrompt-d77c8cac-de94-4c5b-8014-34c65beb0cc1.m4a',
                function (url) {
                    var time = new Date().getTime() - start;
                    assert(time < 5);
                    done();
                }
            );
        });
    });
});


