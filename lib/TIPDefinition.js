var rss = require('./rssDefinition');
var https = require('follow-redirects').https;
const baseURL = 'https://s3.amazonaws.com/bespoken/TIP/';

const summaryExists = {};

var TIPFeed = function () {
    this.introductionAudioURL = baseURL + 'Introduction.mp3';
    this.promptAudioURL = baseURL + 'Prompt.mp3';
    this.aboutAudioURL = baseURL + 'About+The+Podcast.mp3';
    rss.Feed.call(this);
};

TIPFeed.prototype = rss.Feed.prototype;

TIPFeed.prototype.hasIntroduction = function () {
    return true;
};

TIPFeed.prototype.newItem = function (title, audioURL, description) {
    var item = new TIPFeedItem(title, audioURL, description);
    return item;
};

var TIPFeedItem = function (title, audioURL, description) {
    rss.FeedItem.call(this, title, audioURL, description);
};

TIPFeedItem.prototype = rss.FeedItem.prototype;

TIPFeedItem.prototype.scanAudioURL = function(callback) {
    var self = this;
    var podcastNumber = this.podcastNumberForTitle();

    var summaryURL = summaryExists[podcastNumber]
    if (summaryURL === undefined) {
        var summaryURL = baseURL + "EP" + podcastNumber + ".mp3";
        https.get(summaryURL, function (response) {
            var outputURL = null;
            if (response.statusCode === 200) {
                outputURL = summaryURL;
            }

            summaryExists[podcastNumber] = outputURL;
            callback(null, outputURL);
        });
    } else {
        callback(summaryURL);
    }
};

TIPFeedItem.prototype.podcastNumberForTitle = function() {
    var regex = new RegExp("TIP *([0-9]+)");
    var podcastNumber = null;
    var podcastNumberArray = regex.exec(this.title);
    if (podcastNumberArray !== null) {
        var podcastNumberString = podcastNumberArray[1];
        podcastNumber = parseInt(podcastNumberString);
    }
    return podcastNumber;
};

exports.Feed = TIPFeed;
exports.FeedItem = TIPFeedItem;
