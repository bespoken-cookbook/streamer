'use strict';

var Alexa = require('alexa-sdk');
var AudioManager = require('./audioManager');
var AudioController = require('./audioController');
var constants = require('./constants');

// Binding audio handlers to PLAY_MODE State since they are expected only in this mode.
var audioEventHandlers = Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
    'PlaybackStarted' : function () {
        var controller = new AudioController(this);
        controller.index = parseInt(getToken.call(this));
        controller.playbackFinished = false;
        controller.saveAttributes();
        this.emit(':saveState', true);
    },
    'PlaybackFinished' : function () {
        var controller = new AudioController(this);
        /*
         * AudioPlayer.PlaybackFinished Directive received.
         * Confirming that audio file completed playing.
         * Storing details in dynamoDB using attributes.
         */
        controller.playbackFinished = true;
        controller.enqueuedToken = false;
        controller.saveAttributes();
        this.emit(':saveState', true);
    },
    'PlaybackStopped' : function () {
        var controller = new AudioController(this);
        /*
         * AudioPlayer.PlaybackStopped Directive received.
         * Confirming that audio file stopped playing.
         * Storing details in dynamoDB using attributes.
         */
        controller.index = parseInt(getToken.call(this));
        controller.offsetInMilliseconds = this.event.request.offsetInMilliseconds;
        controller.saveAttributes();

        this.emit(':saveState', true);
    },
    'PlaybackNearlyFinished' : function () {
        var controller = new AudioController(this);

        var self = this;
        /*
         * AudioPlayer.PlaybackNearlyFinished Directive received.
         * Using this opportunity to enqueue the next audio
         * Storing details in dynamoDB using attributes.
         * Enqueuing the next audio file.
         */
        if (controller.enqueuedToken) {
            /*
             * Since AudioPlayer.PlaybackNearlyFinished Directive are prone to be delivered multiple times during the
             * same audio being played.
             * If an audio file is already enqueued, exit without enqueuing again.
             */
            return this.context.succeed(true);
        }
        
        var enqueueIndex = controller.index;
        enqueueIndex +=1;
        // Checking if  there are any items to be enqueued.
        if (enqueueIndex === AudioManager.feed().length()) {
            enqueueIndex = 0;
        }

        var playBehavior = 'ENQUEUE';
        var podcast = AudioManager.feed().item(enqueueIndex);
        controller.enqueuedToken = true;

        controller.saveAttributes();
        this.response.audioPlayerPlay(playBehavior, podcast.audioURL, enqueueIndex + "", controller.index + "", 0);
        this.emit(':responseReady');
    },
    'PlaybackFailed' : function () {
        //  AudioPlayer.PlaybackNearlyFinished Directive received. Logging the error.
        console.log("Playback Failed : %j", this.event.request.error);
        this.context.succeed(true);
    }
});

var scanModeHandlers = Alexa.CreateStateHandler(constants.states.SCAN_MODE, {
    'PlaybackStarted' : function () {
        var controller = new AudioController(this);
        controller.index = parseInt(getToken.call(this));
        controller.playbackFinished = false;
        controller.saveAttributes();
        this.emit(':saveState', true);
    },
    'PlaybackFinished' : function () {
        var controller = new AudioController(this);
        /*
         * AudioPlayer.PlaybackFinished Directive received.
         * Confirming that audio file completed playing.
         * Storing details in dynamoDB using attributes.
         */
        controller.playbackFinished = true;
        controller.enqueuedToken = false;
        controller.saveAttributes();
        this.emit(':saveState', true);
    },
    'PlaybackStopped' : function () {
        var controller = new AudioController(this);
        /*
         * AudioPlayer.PlaybackStopped Directive received.
         * Confirming that audio file stopped playing.
         * Storing details in dynamoDB using attributes.
         */
        controller.index = parseInt(getToken.call(this));
        controller.offsetInMilliseconds = this.event.request.offsetInMilliseconds;
        controller.saveAttributes();

        this.emit(':saveState', true);
    },
    'PlaybackNearlyFinished' : function () {
        var controller = new AudioController(this);

        var self = this;
        /*
         * AudioPlayer.PlaybackNearlyFinished Directive received.
         * Using this opportunity to enqueue the next audio
         * Storing details in dynamoDB using attributes.
         * Enqueuing the next audio file.
         */
        if (controller.enqueuedToken) {
            /*
             * Since AudioPlayer.PlaybackNearlyFinished Directive are prone to be delivered multiple times during the
             * same audio being played.
             * If an audio file is already enqueued, exit without enqueuing again.
             */
            return this.context.succeed(true);
        }

        var token = this.event.request.token;
        var playingSilence = false;
        if (token.endsWith("-SILENCE")) {
            playingSilence = true;
        }

        if (playingSilence) {
            controller.index += 1;
            controller.scanUntilFound('ENQUEUE', token);
        } else {
            var silenceUrl = 'https://s3.amazonaws.com/bespoken/encoded/SilenceTwoSeconds.mp3';
            controller.saveAttributes();
            this.response.audioPlayerPlay('ENQUEUE', silenceUrl, controller.index + '-SILENCE', token, 0);
            this.emit(':responseReady');
        }
    },
    'PlaybackFailed' : function () {
        //  AudioPlayer.PlaybackNearlyFinished Directive received. Logging the error.
        console.log("Playback Failed : %j", this.event.request.error);
        this.context.succeed(true);
    }
});

module.exports = {
    playHandler: audioEventHandlers,
    scanHandler: scanModeHandlers
};

function getToken() {
    // Extracting token received in the request.
    return this.event.request.token;
}

function getOffsetInMilliseconds() {
    // Extracting offsetInMilliseconds received in the request.
    return this.event.request.offsetInMilliseconds;
}