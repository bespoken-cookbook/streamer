var bst = require('bespoken-tools');
var child_process = require('child_process');
var fs = require('fs');
var http = require('follow-redirects').http;
var https = require('follow-redirects').https;
var AWS = require('aws-sdk');
var tmp = require('tmp');

const bucketName = 'bespoken/streaming';
const encoder = new bst.BSTEncode({
    bucket: bucketName,
    filterVolume: 2.0
});

var AudioConverter = {
    cache: {},

    convertAndUpload: function(name, url, callback) {
        var self = this;
        var convertedURL = this.cache[url];
        if (convertedURL === undefined) {
            var outputURL = this.urlForKey(bucketName, name);
            this.audioExists(outputURL, function (existingURL) {
                if (existingURL !== null) {
                    self.cache[url] = existingURL;
                    callback(existingURL);
                }

                encoder.encodeURLAndPublishAs(url, name, function(error, encodedURL) {
                    console.log("Error: " + error);
                    console.log("URL: " + encodedURL + ' Raw: ' + url);
                    self.cache[url] = encodedURL;
                    if (existingURL === null) {
                        callback(encodedURL);
                    }
                });
            });
        } else {
            callback(convertedURL);
        }
    },

    audioExists: function(url, callback) {
        var responseCallback = function(response) {
            var exists = response.statusCode === 200;
            if (exists) {
                callback(url);
            } else {
                callback(null)
            }
        }

        https.get(url, responseCallback).end();
    },

    urlForKey: function(bucket, key) {
        return 'https://s3.amazonaws.com/' + bucket + '/' + key;
    }
};

module.exports = AudioConverter;