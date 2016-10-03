var striptags = require('striptags');
var tts = require('./textToSpeech');
var us = require('underscore.string');

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

var FeedItem = function (title, audioURL, description) {
    this.title = title;

    // Auto-convert http to https, but print out a warning
    if (audioURL.startsWith('http:')) {
        console.error('Invalid URL: ' + audioURL + " Will automatically try as https");
        audioURL = audioURL.replace('http', 'https');
    }

    if (description !== null) {
        this.description = description.trim();
        this.description = striptags(this.description);
    }

    //if (description.startsWith('[['))
    this.audioURL = audioURL;
};

FeedItem.prototype.uniqueID = function () {
    var id = us.replaceAll(this.title, ' ', '');
    id = us.replaceAll(id, '-', '');
    id = us.replaceAll(id, '\\.', '');
    id = us.replaceAll(id, '/', '');
    id = us.replaceAll(id, ':', '');
    id = us.replaceAll(id, '\\(', '');
    id = us.replaceAll(id, '\\)', '');
    return id;
}

FeedItem.prototype.scanAudioURL = function(callback) {
    tts.convertToSpeechAsMP3(this.uniqueID() + '.mp3', this.description, null, function (error, url) {
        callback(error, url);
    });
};

exports.Feed = Feed;
exports.FeedItem = FeedItem;



