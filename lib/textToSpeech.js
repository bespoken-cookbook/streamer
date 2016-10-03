var AudioConverter = require('./audioConverter');
var https = require('https');
var us = require('underscore.string');
var xml2js = require('xml2js');

var TextToSpeech = {
    convertToSpeech: function(text, voice, callback) {
        if  (voice === null) {
            voice = 'TTS_PAUL_DB';
        }

        let textCleaned = us.replaceAll(text, ' ', '+');
        let path = '/rest_1_1.php?method=ConvertSimple'
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
        var startTime = new Date().getTime();

        this.convertToSpeech(text, voice, function (error, url) {
            if (error === null) {
                AudioConverter.convertAndUpload(key, url, function (convertedUrl) {
                    var totalTime = (new Date().getTime() - startTime);
                    console.log("ProcessingTime: " + totalTime);

                    callback(null, convertedUrl);
                });
            }
        });
    },

    checkStatus: function (conversionNumber, callback) {
        let path = '/rest_1_1.php?method=GetConversionStatus'
            + '&email=jpk@xappmedia.com'
            + '&accountId=0e6f67a368'
            + '&conversionNumber=' + conversionNumber;

        this.call('tts.neospeech.com', path, function (data) {
            TextToSpeech.convertCheckStatusResponse(data, function (error, status) {
                if (status.status === 'Completed') {
                    callback(null, status);
                } else if (status.status === 'Failed') {
                    // Pass back the raw data if this fails for some reason
                    callback(data);
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
        let o = {};
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
        let o = {};
        xml2js.parseString(xmlString, function (error, result) {
            if (error !== undefined && error !== null) {
                callback(error);
            } else {
                o.resultCode = result.response.$.resultCode;
                o.resultString = result.response.$.resultString;
                o.conversionNumber = result.response.$.conversionNumber;
                o.status = result.response.$.status;
                o.statusCode = result.response.$.statusCode;
                callback(null, o)
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
                callback(data);
            });
        }

        https.request(options, responseCallback).end();
    }
};

module.exports = TextToSpeech;
