/**
 * Module to manage audio data for a session
 */

/**
 * Singleton to manage
 * @param audioSource
 * @constructor
 */
var AudioManager = {
    introduction: 'Welcome to the JPK Podcast. You can say, play the audio to begin the podcast.',
    introductionReprompt: 'You can say, play the audio, to begin.',
    ssml: null,
    tracks: null, // Will be array of audio items

    load: function (audioSourceType, audioSource, options, intent, callback) {
        this.audioSourceType = audioSourceType;
        this.audioSource = audioSource;

        if (audioSourceType === 'XAPP') {
            require('./xappAdapter').XAPPAdapter.fromRequest(options.environment, audioSource, intent, function (audioData) {
                if (audioData === null) {
                    callback("XAPP not found or error occurred");
                } else {
                    callback();
                }
            });
        } else if (this.tracks === null) {
            console.log("Loading Audio Assets");
            if (this.audioSourceType === 'static') {
                AudioManager.audioAssetArray = require('./audioAssets');
                callback();
            } else if (audioSourceType === 'URL') {
                require('./rssAdapter').fromURL(this.audioSource, function (error, audioData) {
                    AudioManager.configure(audioData);
                    callback();
                });
            } else if (audioSourceType === 'file') {
                require('./rssAdapter').fromFile(this.audioSource, function (error, audioData) {
                    AudioManager.configure(audioData);
                    callback();
                });
            }
        } else {
            callback();
        }

    },

    configure: function(audioData) {
        AudioManager.tracks = audioData.tracks;
        AudioManager.introduction = cleanSSML(audioData.introduction);
        AudioManager.introductionReprompt = cleanSSML(audioData.introductionReprompt);
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

function cleanSSML(ssml) {
    if (ssml === undefined) {
        return undefined;
    }

    if (ssml === null) {
        return null;
    }

    return ssml.substring(7, ssml.indexOf('</speak>'));
}

module.exports = AudioManager;




