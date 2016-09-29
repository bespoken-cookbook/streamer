var assert = require('assert');
var AudioManager = require('../lib/audioManager');

describe('AudioManager', function() {
    describe('#fromURL', function() {
        it("Correctly loads RSS feed from URL", function(done) {
            this.timeout(10000);
            AudioManager.load('file', 'test/rssFeed.xml', null, null, function () {
                assert.equal(AudioManager.feed().items.length, 6);
                assert(AudioManager.feed());
                AudioManager.introductorySSML(function (ssml) {
                    assert.equal(ssml, '<speak><audio src="https://s3.amazonaws.com/bespoken/streaming/ExampleAlexaPodcast-INTRODUCTION.mp3" /></speak>');
                    done();
                });
            });
        });
    });
});


