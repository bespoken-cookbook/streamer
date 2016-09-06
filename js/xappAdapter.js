var https = require('https');
var uuid = require('node-uuid');

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

/**
 * Requests the specified xapp
 * Passes an intent if specified
 * Returns audioData to set on the AudioManager
 * @param xappTag
 * @param intent
 * @param callback
 */
XAPPAdapter.prototype.request = function(xappTag, intent, callback) {
    var self = this;
    this.accessor.request(xappTag, function (xappResponse) {
        var audioData = self.adapt(xappTag, intent, xappResponse);
        callback(audioData);
    });
}

/**
 * Turns the raw XAPP response into AudioData
 * @param xappTag
 * @param xappResponse
 * @returns {{introduction: string, introductionReprompt: string, tracks: Array}}
 */
XAPPAdapter.prototype.adapt = function(xappTag, intent, xappResponse) {
    var introduction = '';
    if (xappResponse.nowPlayingText !== null) {
        // If we see the speak tag, means this is already ssml
        introduction = this.textAsSSML(xappResponse.nowPlayingText);
    } else {
        introduction = '<audio>' + xappResponse.linearCreatives[0].url + '</audio>';
    };

    var tracks = [];
    var ssml = null;
    for (var action of xappResponse.actions) {
        if (action.actionType === 'CUSTOM') {
            var customActionIntent = false;
            // If the user said something, and it was not a builtin intent, only use the action
            //  that corresponds to the intent
            if (intent !== null && !intent.startsWith("AMAZON")) {
                if (!phrasesMatch(intent, action.phrase)) {
                    // Filter by the intent if one is specified
                    continue;
                } else {
                    customActionIntent = true;
                }
            }

            var customParameter = action.fulfillments[0].extras.customParameter;

            var customJSON = null;
            try {
                customJSON = JSON.parse(customParameter);
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
            if (customActionIntent && customJSON === null) {
                ssml = '<speak><audio url="' + action.fulfillments[0].trailingAudioURL + '" /></speak>';

            } else if (customActionIntent && customJSON.tts !== undefined) {
                // If there is a tts set, use that
                ssml = this.textAsSSML(customJSON.tts);

            } else if (customJSON !== null && customJSON.tracks !== undefined) {
                for (var track of customJSON.tracks) {
                    this.addTrack(tracks, xappTag, track);
                }

            } else if (customJSON !== null && customJSON.title !== undefined) {
                this.addTrack(tracks, xappTag, customJSON);

            }

        }
    }
    var audioData = {
        'introduction': introduction,
        'introductionReprompt': introduction,
        'ssml': ssml,
        'tracks': tracks
    }
    return audioData;
};

XAPPAdapter.prototype.addTrack = function(tracks, xappTag, jsonData) {
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

    console.log("JSON: " + JSON.stringify(request, null, 2));

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
            console.log(JSON.stringify(responseData, null, 2));
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

function replaceAll(str, search, replacement) {
    return str.split(search).join(replacement);
};

exports.XAPPAccessor = XAPPAccessor;
exports.XAPPAdapter = XAPPAdapter;

