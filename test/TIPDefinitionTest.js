var assert = require('assert');
var rss = require('../lib/TIPDefinition');

describe('TIPFeedItem', function() {

    describe('#podcastNumberForTitle', function(done) {
        it("Extracts the podcast number", function(done) {
            var item = new rss.FeedItem('TIP 105 : Mastermind Group 2016 3rd Quarter (Business Podcast)', 'https://podcast.com', 'Description');
            var podcastNumber = item.podcastNumberForTitle();
            assert.equal(podcastNumber, 105);
            done();
        });

        it("Extracts the podcast number with leading 0", function(done) {
            var item = new rss.FeedItem('TIP 099 : Mastermind Group 2016 3rd Quarter (Business Podcast)', 'https://podcast.com', 'Description');
            var podcastNumber = item.podcastNumberForTitle();
            assert.equal(podcastNumber, 99);
            done();
        });

        it("Extracts the podcast number with exra space", function(done) {
            var item = new rss.FeedItem('TIP  100 : Mastermind Group 2016 3rd Quarter (Business Podcast)', 'https://podcast.com', 'Description');
            var podcastNumber = item.podcastNumberForTitle();
            assert.equal(podcastNumber, 100);
            done();
        });

        it("Extracts nothing", function(done) {
            var item = new rss.FeedItem('TIP A010 : Mastermind Group 2016 3rd Quarter (Business Podcast)', 'https://podcast.com', 'Description');
            var podcastNumber = item.podcastNumberForTitle();
            assert.equal(podcastNumber, null);
            done();
        });

    });

    describe("#scanAudioURL()", function(done) {
        it("Gets an existing file", function(done) {
            this.timeout(5000);
            var item = new rss.FeedItem('TIP 105 : Mastermind Group 2016 3rd Quarter (Business Podcast)', 'https://podcast.com', 'Description');
            item.scanAudioURL(function (error, url) {
                assert.equal(url, 'https://s3.amazonaws.com/bespoken/TIP/EP105.mp3');
                done();
            });
        });

        it("Gets an existing file starting with 0", function(done) {
            this.timeout(5000);
            var item = new rss.FeedItem('TIP 099 : Mastermind Group 2016 3rd Quarter (Business Podcast)', 'https://podcast.com', 'Description');
            item.scanAudioURL(function (error, url) {
                assert.equal(url, 'https://s3.amazonaws.com/bespoken/TIP/EP99.mp3');
                done();
            });
        });
        it("Fails to get a non-existent file", function(done) {
            this.timeout(5000);
            var item = new rss.FeedItem('TIP 089 : Mastermind Group 2016 3rd Quarter (Business Podcast)', 'https://podcast.com', 'Description');
            item.scanAudioURL(function (error, url) {
                assert.equal(url, null);
                done();
            });
        });
    });


});
