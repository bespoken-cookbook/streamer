var assert = require('assert');
var XAPPAccessor = require('../xappAdapter').XAPPAccessor;
var XAPPAdapter = require('../xappAdapter').XAPPAdapter;

describe('XAPPAdapter', function() {
    describe('#request', function() {
        it("Loads and adapts XAPP", function(done) {
            var adapter = new XAPPAdapter('preview.xappmedia.com',
                'XappMediaApiKey',
                'DefaultApp');
            adapter.request('Streaming/JPKStreamingTest', function(audioData) {
                assert.equal(audioData.introduction, "<speak>Speak now or forever</speak>");
                assert.equal(audioData.tracks.length, 3);
                assert.equal(audioData.tracks[0].title, 'Podcast1');
                assert.equal(audioData.tracks[1].title, 'Podcast1');
                assert.equal(audioData.tracks[2].title, 'Podcast2');
                done();
            });
        });
    });
});

describe('XAPPAccessor', function() {
    describe('#request', function() {
        it("Loads XAPP", function(done) {
            var accessor = new XAPPAccessor('preview.xappmedia.com',
                'XappMediaApiKey',
                'DefaultApp');
            accessor.request('Streaming/JPKStreamingTest', function (response, error) {
                assert.equal(response.xappName, "JPKStreamingTest");
                done();
            });
        });
    });
});