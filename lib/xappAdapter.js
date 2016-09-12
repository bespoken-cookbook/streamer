var https = require('https');
var uuid = require('node-uuid');
var AudioConverter = require('./audioConverter');

var environments = {
    AlexaDemo: {
        server: 'preview.xappmedia.com',
        apiKey: '28caaa49-ce89-4fcd-a662-1d5dbb82ca06',
        appKey: '1e748bcb-3fc2-46bf-812d-7afa805d5fec'
    },
    XappMediaTest: {
        server: 'preview.xappmedia.com',
        apiKey: 'XappMediaApiKey',
        appKey: 'DefaultApp'
    }
};

/**
 * XAPPAdapter calls the accessor and turns XAPPs into Alexa feeds
 * @param server
 * @param apiKey
 * @param appKey
 * @constructor
 */
var XAPPAdapter = function (server, apiKey, appKey) {
    this.accessor = new XAPPAccessor(server, apiKey, appKey);
}

XAPPAdapter.fromRequest = function(environmentName, tag, intent, callback) {
    var environment = environments[environmentName];
    if (environment === undefined) {
        throw new Error("No environment defined: " + environmentName);
    }
    var adapter = new XAPPAdapter(environment.server, environment.apiKey, environment.appKey);
    adapter.request(tag, intent, callback);
}
/**
 * Requests the specified xapp
 * Passes an intent if specified
 * Returns audioData to set on the AudioManager
 * @param xappTag
 * @param intent
 * @param callback
 */
XAPPAdapter.prototype.request = function(xappTag, intent, callback, conversionCallback) {
    var self = this;
    this.accessor.request(xappTag, function (xappResponse) {
        if (xappResponse === null) {
            console.error("No XAPP found: " + xappTag);
            callback(null);
        } else {
            var audioData = self.adapt(xappTag, intent, xappResponse, conversionCallback);
            callback(audioData);
        }

    });
}

/**
 * Turns the raw XAPP response into AudioData
 * @param xappTag
 * @param xappResponse
 * @returns {{introduction: string, introductionReprompt: string, tracks: Array}}
 */
XAPPAdapter.prototype.adapt = function(xappTag, intent, xappResponse, conversionCallback) {
    var introduction = '';
    //console.log(JSON.stringify(xappResponse, null, 2));

    if (xappResponse.nowPlayingText !== null && xappResponse.nowPlayingText.length > 0) {
        // If we see the speak tag, means this is already ssml
        introduction = this.textAsSSML(xappResponse.nowPlayingText);
    } else {
        var introURL = this.convert(xappResponse, 'PROMPT', xappResponse.linearCreatives[0].url);
        introduction = '<speak><audio src="' + introURL + '"></audio></speak>';
    };

    var tracks = [];
    var ssml = null;
    var hasCustomIntent = false;
    for (var action of xappResponse.actions) {
        if (action.actionType === 'CUSTOM') {
            var customActionIntent = false;
            // If the user said something, and it was not a builtin intent, only use the action
            //  that corresponds to the intent
            if (intent !== null && !intent.startsWith("AMAZON") && intent !== 'PlayAudio') {
                if (!phrasesMatch(intent, action.phrase)) {
                    // Filter by the intent if one is specified
                    continue;
                } else {
                    customActionIntent = true;
                    hasCustomIntent = true;
                }
            }

            var customParameter = action.fulfillments[0].extras.customParameter;
            var trailingAudioURL = action.fulfillments[0].trailingAudioURL;

            var customJSON = null;
            try {
                if (customParameter !== null && customParameter.length > 0) {
                    customJSON = JSON.parse(customParameter);
                }
            } catch (e) {
                console.error(e + ' CustomData: ' + customParameter);
            }

            // Do a couple possible things here:
            //  If the JSON is empty, use the trailing audio
            //      Though only if this specific custom action was called for by the  user
            //  If it has a TTS element, play that back
            //      Though only if this specific custom action was called for by the  user
            //  If it has a tracks array, then this is a playlist
            //  If it has one element, then just one stream
            //  If it is set to feed = true, then play the trailing audio as a stream
            if (customActionIntent && customJSON === null) {
                var url = this.convert(xappResponse, 'TRAILING', trailingAudioURL, conversionCallback);
                ssml = '<speak><audio src="' + url + '" /></speak>';

            } else if (customActionIntent && customJSON.tts !== undefined) {
                // If there is a tts set, use that
                ssml = this.textAsSSML(customJSON.tts);

            } else if (customJSON !== null && customJSON.tracks !== undefined) {
                for (var track of customJSON.tracks) {
                    this.addTrack(tracks, xappTag, track);
                }

            } else if (customJSON !== null && customJSON.title !== undefined) {
                this.addTrack(tracks, xappTag, customJSON);

            } else if (customJSON !== null && customJSON.feed !== undefined && customJSON.feed) {
                this.addTrack(tracks, xappTag, {'title': action.phrase, 'url': trailingAudioURL});

            }

        }
    }
    var audioData = {
        'customActionIntent': hasCustomIntent,
        'introduction': introduction,
        'introductionReprompt': introduction,
        'ssml': ssml,
        'tracks': tracks
    };
    return audioData;
};

/**
 * Creates a new name for the file and uploads asynchronously to S3
 * @param xapp
 * @param part
 */
XAPPAdapter.prototype.convert = function(xapp, part, url, callback) {
    var key = strip(xapp.accountName) + "-" + strip(xapp.xappName) + "-" + xapp.id + "-" + part + ".mp3";
    var s3url = AudioConverter.convertAndUpload(key, url, function (outputUrl) {
        if (callback !== undefined) {
            console.log("S3 Object Created: " + outputUrl);
            callback();
        }
    });
    return s3url;
};

XAPPAdapter.prototype.addTrack = function(tracks, xappTag, jsonData) {
    console.log("AddTrack: " + JSON.stringify(jsonData));
    let track = null;
    if (jsonData.title === undefined) {
        console.error('XAPP ' + xappTag + ' No title defined for track: ' + JSON.stringify(jsonData));
    } else if (jsonData.url === undefined) {
        console.error('XAPP ' + xappTag + ' No url defined for track: ' + JSON.stringify(jsonData));
    } else {
        track = jsonData;
    }

    if (track !== null) {
        tracks.push(track);
    }
}

XAPPAdapter.prototype.textAsSSML = function(text) {
    var output = null;
    if (text.indexOf('<speak>') !== -1) {
        output = text;
    } else {
        output = '<speak>' + text + '</speak>';
    }
    return output;
}

var XAPPAccessor = function (server, apiKey, appKey) {
    this.server = server;
    this.apiKey = apiKey;
    this.appKey = appKey;
    this.sessionKey = uuid.v4();
}

XAPPAccessor.prototype.request = function (xappTag, callback) {
    console.log("SessionKey: " + this.sessionKey);
    var request = {
        'apiVersion': 4,
        'authData': {
            'apiKey': this.apiKey,
            'applicationKey': this.appKey,
            'sessionKey': this.sessionKey
        },
        'timeZoneOffset': '-00:00',
        'tagInfo': {
            'tag': xappTag,
            'adServer': 'XAPP'
        },
        'sdkVersion': '0.1.0',
        'device': {
            'osVersion': '0.0.0',
            'carrier': 'AWS',
            'model': 'Alexa',
            'manufacturer': 'Amazon',
            'platform': 'ios', // Set this to iOS because it has to be ios or android
            'languageCode': 'en',
            'id': 'JPK'
        },
        'context': {
            'country': 'US',
            'gender': 'M',
            'age': 29,
            'state': 'MD'
        },
        'parameters': {
            'calendarCapability': true,
            'callCapability': true,
            'emailCapability': true,
            'recordCapability': true,
            'platform': 'android',
            'genre': 'Rock',
            'audioRouteType': 'Bluetooth'
        }
    };

    //console.log("JSON: " + JSON.stringify(request, null, 2));

    this.call('/rest/api/v4/xappRequest', request, callback);
}

XAPPAccessor.prototype.call = function (path, requestJSON, callback) {
    var jsonString = JSON.stringify(requestJSON);
    //The url we want is `www.nodejitsu.com:1337/`
    var options = {
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(jsonString)
        },
        host: this.server,
        //This is what changes the request to a POST request
        method: 'POST',
        path: path,
        //since we are listening on a custom port, we need to specify it by hand
        port: '443'
    };

    var responseCallback = function(response) {
        var responseString = '';
        response.on('data', function (chunk) {
            responseString += chunk;
        });

        response.on('error', function (error) {
            callback(null, error);
        });

        response.on('end', function (arg1) {
            var responseData = JSON.parse(responseString);
            //console.log(JSON.stringify(responseData, null, 2));
            if (response.statusCode === 200) {
                callback(responseData);
            } else {
                callback(null, responseData);
            }

        });
    }

    var req = https.request(options, responseCallback);
    //This is the data we are posting, it needs to be a string or a buffer
    req.write(jsonString);
    req.end();
};

XAPPAccessor.prototype.respondToXAPP = function () {
    // No-op for now - we use V4
};

function phrasesMatch (s, s2) {
    if (s === undefined || s === null || s2 === undefined || s2 === null) {
        return false;
    }

    s = replaceAll(s, ' ', '').toLowerCase();
    s2 = replaceAll(s2, ' ', '').toLowerCase();

    return s === s2;
}

function strip(s) {
    return replaceAll(s, ' ', '');
};

function replaceAll(str, search, replacement) {
    return str.split(search).join(replacement);
};

exports.XAPPAccessor = XAPPAccessor;
exports.XAPPAdapter = XAPPAdapter;

