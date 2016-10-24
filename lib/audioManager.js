var AudioConverter = require('../lib/audioConverter');
var tts = require('../lib/textToSpeech');
var rssAdapter = require('./rssAdapter');

var reprompt = 'You can say play, scan titles, or about the podcast';

/**
 * Singleton to manage
 * @param audioSource
 * @constructor
 */
var AudioManager = {
    _feed: null,

    reset: function () {
        this._feed = null;
    },

    load: function (audioSourceType, audioSource, callback) {
        var self = this;
        rssAdapter.initialize(audioSource);
        this.audioSourceType = audioSourceType;
        this.audioSource = audioSource;

        if (this._feed === null) {
            if (audioSourceType.toLowerCase() === 'url') {
                rssAdapter.fromURL(this.audioSource, function (error, feed) {
                    self._feed = feed;
                    callback(error, feed);
                });
            } else if (audioSourceType.toLowerCase() === 'file') {
                rssAdapter.fromFile(this.audioSource, function (error, feed) {
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
        var self = this;
        if (this.feed().hasIntroduction()) {
            var introductionKey = this.feed().uniqueID() + '-INTRODUCTION.mp3';
            AudioConverter.convertAndUpload(introductionKey, this.feed().introductionAudioURL, function (convertedIntroURL) {
                if (self.feed().promptAudioURL !== undefined && self.feed().promptAudioURL !== null) {
                    var promptKey = self.feed().uniqueID() + '-PROMPT.mp3';
                    AudioConverter.convertAndUpload(promptKey, self.feed().promptAudioURL, function (convertedPromptURL) {
                        var ssml = '<audio src="' + convertedIntroURL + '" /><audio src="' + convertedPromptURL + '" />';
                        ready(ssml, reprompt);
                    });
                } else {
                    var ssml = '<audio src="' + convertedIntroURL + '" />' + reprompt;
                    ready(ssml, reprompt);
                }

            });

        } else {
            var ssml = this.feed().description;
            ready(ssml);
        }
    },

    aboutSSML: function (ready) {
        var self = this;
        if (this.feed().aboutAudioURL) {
            var aboutKey = this.feed().uniqueID() + '-ABOUT.mp3';
            AudioConverter.convertAndUpload(aboutKey, this.feed().aboutAudioURL, function (convertedAboutURL) {
                var ssml = '<audio src="' + convertedAboutURL + '" />' + reprompt;
                ready(ssml, reprompt);
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




