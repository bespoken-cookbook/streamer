var assert = require('assert');
var AudioManager = require('../audioManager');

describe('AudioManager', function() {
    describe('#fromURL', function() {
        it("Correctly loads RSS feed from URL", function(done) {
            AudioManager.load('URL', 'https://s3.amazonaws.com/bespoken/streaming/rssFeed.xml', null, null, function () {
                assert.equal(AudioManager.audioAssets().length, 4);
                assert(AudioManager.tracks !== null);
                done();
            });
        });

        it("Correctly loads RSS feed from URL", function(done) {
            AudioManager.load('XAPP', 'Streaming/JPKStreamingTest',
                {environment: 'XappMediaTest'},
                'ConfirmPayment',
                function () {
                    assert.equal(AudioManager.audioAssets().length, 0);
                    assert(AudioManager.ssml);
                    assert.equal(AudioManager.ssml, '<audio url="https://s3.amazonaws.com/xapp-alexa/Streaming-JPKStreamingTest-2874-TRAILING.mp3" />');
                    done();
                }
            );
        });


    });
});


