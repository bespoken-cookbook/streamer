/**
 * Module to manage audio data for a session
 */

/**
 * Singleton to manage
 * @param audioSource
 * @constructor
 */
var AudioManager = {
    introduction: 'Welcome to the AWS Podcast. You can say, play the audio to begin the podcast.',
    introductionReprompt: 'You can say, play the audio, to begin.',
    tracks: null, // Will be array of audio items

    load: function (audioSourceType, audioSource, callback) {
        this.audioSourceType = audioSourceType;
        this.audioSource = audioSource;

        if (AudioManager.audioAssetArray === null) {
            console.log("Loading Audio Assets");
            if (this.audioSourceType === 'static') {
                AudioManager.audioAssetArray = require('./audioAssets');
                callback();
            } else if (audioSourceType === 'url') {
                require('./rssAdapter').fromURL(this.audioSource, function (error, audioData) {
                    AudioManager.configure(audioData);
                    callback();
                });
            } else if (audioSourceType === 'file') {
                require('./rssAdapter').fromFile(this.audioSource, function (error, audioData) {
                    AudioManager.configure(audioData)
                    callback();
                });
            }
        } else {
            callback();
        }

    },

    configure: function(audioData) {
        AudioManager.audioAssetArray = audioData.tracks;
    },

    audioAssets: function () {
        if (AudioManager.audioAssetArray === null) {
            // This should not happen - should already be loaded on startup
            return [];
        } else {
            return AudioManager.audioAssetArray;
        }
    }
};

module.exports = AudioManager;




