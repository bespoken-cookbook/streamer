var assert = require('assert');
var RSSAdapter = require('../lib/rssAdapter');

describe('RSSAdapter', function() {
    describe('#fromFile', function() {
        it('Correctly parses RSS feed from file', function(done) {
            RSSAdapter.fromFile('test/rssFeed.xml', function (error, feed) {
                assert.equal(feed.description, 'The latest info on alexa');
                assert.equal(feed.introduction.audioURL, 'https://s3.amazonaws.com/xapp-alexa/JPKUnitTest-JPKUnitTest-1645-TAKEMETOWALMART-TRAILING.mp3');
                assert.equal(feed.items.length, 6);
                assert.equal(feed.items[0].audioURL, 'https://s3.amazonaws.com/xapp-alexa/JPKUnitTest-JPKUnitTest-1645-TAKEMETOWALMART-TRAILING.mp3');
                done();
            });
        });

        it('Correctly parses RSS feed from URL', function(done) {
            RSSAdapter.fromURL('https://s3.amazonaws.com/bespoken/streaming/rssFeed.xml', function (error, feed) {
                assert.equal(feed.items.length, 4);
                assert.equal(feed.items[0].audioURL, 'https://feeds.soundcloud.com/stream/275202399-amazon-web-services-306355661-amazon-web-services.mp3');
                done();
            });
        });

        it('Correctly parses RSS feed from HTTP URL', function(done) {
            RSSAdapter.fromURL('http://s3.amazonaws.com/bespoken/streaming/rssFeed.xml?queryString=1', function (error, feed) {
                assert.equal(feed.items.length, 4);
                assert.equal(feed.items[0].audioURL, 'https://feeds.soundcloud.com/stream/275202399-amazon-web-services-306355661-amazon-web-services.mp3');
                done();
            });
        });
    });
});


