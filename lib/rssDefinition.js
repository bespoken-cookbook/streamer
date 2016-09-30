var us = require("underscore.string");

var Feed = function () {
    this.title = null;
    this.description = null;
    this.introduction = null;
    this.items = [];
};

Feed.prototype.hasIntroduction = function () {
    return (this.introduction !== undefined && this.introduction !== null);
};

Feed.prototype.addItem = function (feedItem) {
    this.items.push(feedItem);
};

Feed.prototype.uniqueID = function () {
    return us.replaceAll(this.title, ' ', '');
};

Feed.prototype.length = function () {
    return this.items.length;
};

var FeedItem = function (title, audioURL) {
    this.title = title;

    // Auto-convert http to https, but print out a warning
    if (audioURL.startsWith('http:')) {
        console.error('Invalid URL: ' + audioURL + " Will automatically try as https");
        audioURL = audioURL.replace('http', 'https');
    }
    this.audioURL = audioURL;
};

exports.Feed = Feed;
exports.FeedItem = FeedItem;



