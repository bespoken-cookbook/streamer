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
    return (this.introductionAudioURL !== undefined && this.introductionAudioURL !== null);
};

Feed.prototype.newItem = function(title, audioURL, description) {
    return new FeedItem(title, audioURL, description);
};

Feed.prototype.addItem = function (item) {
    this.items.push(item);
};


Feed.prototype.uniqueID = function () {
    return cleanId(this.title);
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
    return cleanId(this.title);
}

FeedItem.prototype.scanAudioURL = function(callback) {
    if (this.summaryAudioURL !== undefined) {
        callback(null, this.summaryAudioURL);
    } else {
        tts.convertToSpeechAsMP3(this.uniqueID() + '.mp3', scanText, null, function (error, url) {
            callback(error, url);
        });
    }
};

var cleanId = function(value) {
    var id = us.replaceAll(value, ' ', '');
    id = us.replaceAll(id, '-', '');
    id = us.replaceAll(id, '\\.', '');
    id = us.replaceAll(id, '/', '');
    id = us.replaceAll(id, ':', '');
    id = us.replaceAll(id, '\\(', '');
    id = us.replaceAll(id, '\\)', '');
    id = us.replaceAll(id, '\'', '');
    return id;
}

exports.Feed = Feed;
exports.FeedItem = FeedItem;



