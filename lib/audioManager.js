var AudioConverter = require('../lib/audioConverter');

/**
 * Singleton to manage
 * @param audioSource
 * @constructor
 */
var AudioManager = {
    _feed: null,

    load: function (audioSourceType, audioSource, options, intent, callback) {
        var self = this;
        this.audioSourceType = audioSourceType;
        this.audioSource = audioSource;

        if (this._feed === null) {
            console.log("Loading Audio Assets");
            if (audioSourceType === 'URL') {
                require('./rssAdapter').fromURL(this.audioSource, function (error, feed) {
                    self._feed = feed;
                    callback(feed);
                });
            } else if (audioSourceType === 'file') {
                require('./rssAdapter').fromFile(this.audioSource, function (error, feed) {
                    self._feed = feed;
                    callback(feed);
                });
            }
        } else {
            callback(this._feed);
        }

    },

    feed: function () {
        return this._feed;
    },

    introductorySSML: function (ready) {
        if (this.feed().hasIntroduction()) {
            var introductionKey = this.feed().uniqueID() + '-INTRODUCTION.mp3';
            var convertedURL = AudioConverter.convertAndUpload(introductionKey, this.feed().introduction.audioURL, function () {
                var ssml = '<speak><audio src="' + convertedURL + '" /></speak>';
                ready(ssml);
            });

        } else {
            var ssml = '<speak>' + this.feed().description + '</speak>';
            ready(ssml);
        }
    },

    configure: function(audioData) {
        AudioManager.play = (audioData.customActionIntent && audioData.tracks.length > 0);
        AudioManager.tracks = audioData.tracks;
        //AudioManager.introduction = cleanSSML(audioData.introduction,
        //    '<speak>Welcome to the JPK Podcast. You can say, play the audio to begin the podcast.</speak>');
        AudioManager.introductionReprompt = cleanSSML(audioData.introductionReprompt,
            '<speak>You can say, play the audio, to begin.</speak>');
        AudioManager.ssml = cleanSSML(audioData.ssml);
    },

    audioAssets: function () {
        if (AudioManager.tracks === null) {
            // This should not happen - should already be loaded on startup
            return [];
        } else {
            return AudioManager.tracks;
        }
    }
};

function cleanSSML(ssml, defaultSSML) {
    if (ssml === undefined) {
        if (defaultSSML) {
            ssml = defaultSSML;
        } else {
            return undefined;
        }
    }

    if (ssml === null) {
        return null;
    }

    return ssml.substring(7, ssml.indexOf('</speak>'));
}

module.exports = AudioManager;




