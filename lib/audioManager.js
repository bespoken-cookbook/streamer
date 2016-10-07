var AudioConverter = require('../lib/audioConverter');
var tts = require('../lib/textToSpeech');

var newSessionBlurb = 'You can say play, scan titles, or about the podcast';

/**
 * Singleton to manage
 * @param audioSource
 * @constructor
 */
var AudioManager = {
    _feed: null,

    load: function (audioSourceType, audioSource, callback) {
        var self = this;
        this.audioSourceType = audioSourceType;
        this.audioSource = audioSource;

        if (this._feed === null) {
            if (audioSourceType === 'URL') {
                require('./rssAdapter').fromURL(this.audioSource, function (error, feed) {
                    self._feed = feed;
                    callback(error, feed);
                });
            } else if (audioSourceType === 'file') {
                require('./rssAdapter').fromFile(this.audioSource, function (error, feed) {
                    self._feed = feed;
                    callback(error, feed);
                });
            }
        } else {
            callback(null, this._feed);
        }

    },

    feed: function () {
        return this._feed;
    },

    introductorySSML: function (ready) {
        if (this.feed().hasIntroduction()) {
            var introductionKey = this.feed().uniqueID() + '-INTRODUCTION.mp3';
            AudioConverter.convertAndUpload(introductionKey, this.feed().introductionAudioURL, function (convertedURL) {
                var ssml = '<audio src="' + convertedURL + '" />' + newSessionBlurb;
                ready(ssml, newSessionBlurb);
            });

        } else {
            var ssml = this.feed().description;
            ready(ssml);
        }
    },

    aboutSSML: function (ready) {
        if (this.feed().aboutAudioURL) {
            var aboutKey = this.feed().uniqueID() + '-ABOUT.mp3';
            AudioConverter.convertAndUpload(aboutKey, this.feed().aboutAudioURL, function (convertedURL) {
                var ssml = '<audio src="' + convertedURL + '" />' + newSessionBlurb;
                ready(ssml, newSessionBlurb);
            });

        } else {
            var ssml = this.feed().description;
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




