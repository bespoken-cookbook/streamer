var AudioConverter = require('./audioConverter');
var https = require('https');
var us = require('underscore.string');
var xml2js = require('xml2js');

var TextToSpeech = {
    cache: {},

    convertToSpeech: function(text, voice, callback) {
        if  (voice === null) {
            voice = 'TTS_PAUL_DB';
        }

        var textCleaned = us.replaceAll(text, ' ', '+');
        var path = '/rest_1_1.php?method=ConvertSimple'
            + '&email=jpk@xappmedia.com'
            + '&accountId=0e6f67a368'
            + '&loginKey=LoginKey'
            + '&loginPassword=58e18c2ac2417b0128c2'
            + '&outputFormat=FORMAT_WAV'
            + '&sampleRate=16'
            + '&text=' + textCleaned
            + '&voice=' + voice;

        this.call('tts.neospeech.com', path, function (data) {
            TextToSpeech.convertConvertSimpleResponse(data, function (error, payload) {
                if (error !== null) {
                    callback(error);
                } else if (payload.conversionNumber !== undefined && payload.conversionNumber !== null) {
                    var startTime = new Date().getTime();
                    TextToSpeech.checkStatus(payload.conversionNumber, function (error, status) {
                        if (error === null) {
                            var totalTime = (new Date().getTime() - startTime);
                            console.log("ProcessingTime: " + totalTime);
                            callback(null, status.downloadUrl);
                        } else {
                            console.error('Error on converting TTS: ' + error);
                        }
                    });
                }
            });
        });
    },

    // Takes text and turns it into an MP3
    //  Helper function that calls our own audio converter after turning the speech into a WAV file
    convertToSpeechAsMP3: function (key, text, voice, callback) {
        var cachedURL = this.cache[text];
        if (cachedURL === undefined) {
            var startTime = new Date().getTime();

            this.speechAsMP3Exists(key, text, voice, function (alreadyExistsURL) {
                if (alreadyExistsURL !== null) {
                    TextToSpeech.cache[text] = alreadyExistsURL;
                    callback(null, alreadyExistsURL);
                }

                TextToSpeech.convertToSpeech(text, voice, function (error, url) {
                    if (error === null) {
                        AudioConverter.convertAndUpload(key, url, function (convertedURL) {
                            var totalTime = (new Date().getTime() - startTime);
                            console.log("ProcessingTime: " + totalTime);

                            if (alreadyExistsURL === null) {
                                callback(null, convertedURL);
                            }
                            TextToSpeech.cache[text] = convertedURL;
                        });
                    }
                });
            });
        } else {
            callback(null, cachedURL);
        }

    },

    // Check if an MP3 file exists
    //  Since conversion is slow, use the old one if it is there, even if it has changed
    speechAsMP3Exists: function(key, text, voice, callback) {
        var path = '/bespoken/streaming/' + key;
        var host = 's3.amazonaws.com';
        var options = {
            host: host,
            path: path
        };

        var responseCallback = function(response) {
            var exists = response.statusCode === 200;
            if (exists) {
                var url = 'https://' + host + path;
                callback(url);
            } else {
                callback(null)
            }
        }

        https.request(options, responseCallback).end();
    },

    checkStatus: function (conversionNumber, callback) {
        var path = '/rest_1_1.php?method=GetConversionStatus'
            + '&email=jpk@xappmedia.com'
            + '&accountId=0e6f67a368'
            + '&conversionNumber=' + conversionNumber;

        this.call('tts.neospeech.com', path, function (data) {
            TextToSpeech.convertCheckStatusResponse(data, function (error, status) {
                console.log('Status: ' + status.status);
                if (status.status === 'Completed') {
                    callback(null, status);
                } else if (status.status === 'Failed') {
                    console.error('Failed Processing: ' + data);
                    // Pass back the raw data if this fails for some reason
                    callback(status);
                } else {
                    //Means we are in process, so wait a couple ticks and call again
                    setTimeout(function () {
                        TextToSpeech.checkStatus(conversionNumber, callback);
                    }, 10);
                }
            });
        });
    },

    convertCheckStatusResponse(xmlString, callback) {
        var o = {};
        xml2js.parseString(xmlString, function (error, result) {
            if (error !== undefined && error !== null) {
                callback(error);
            } else {
                o.resultCode = result.response.$.resultCode;
                o.resultString = result.response.$.resultString;
                o.conversionNumber = result.response.$.conversionNumber;
                o.status = result.response.$.status;
                o.statusCode = result.response.$.statusCode;
                if (o.status === 'Completed') {
                    o.downloadUrl = result.response.$.downloadUrl;
                }
                callback(null, o)
            }
        });
    },

    convertConvertSimpleResponse(xmlString, callback) {
        var o = {};
        console.log(xmlString);
        xml2js.parseString(xmlString, function (error, result) {
            if (error !== undefined && error !== null) {
                callback(error);
            } else {
                o.resultCode = result.response.$.resultCode;
                o.resultString = result.response.$.resultString;
                o.conversionNumber = result.response.$.conversionNumber;
                o.status = result.response.$.status;
                o.statusCode = result.response.$.statusCode;

                if (o.status === 'Queued') {
                    callback(null, o)
                } else {
                    console.error('Error XML: ' + xmlString);
                    callback('Error Occurred', o);
                }
            }
        });
    },

    call: function(host, path, callback) {
        var options = {
            host: host,
            path: path
        };

        var responseCallback = function(response) {
            var data = new Buffer('');

            //another chunk of data has been recieved, so append it to `str`
            response.on('data', function (chunk) {
                data = Buffer.concat([data, chunk]);
            });

            //the whole response has been received, so we just print it out here
            response.on('end', function () {
                callback(data.toString());
            });
        }

        https.request(options, responseCallback).end();
    }
};

module.exports = TextToSpeech;