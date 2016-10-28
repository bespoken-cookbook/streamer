'use strict';

var Alexa = require('alexa-sdk');
var AudioManager = require('./audioManager');
var AudioController = require('./audioController');
var constants = require('./constants');

var stateHandlers = {
    startModeIntentHandlers : Alexa.CreateStateHandler(constants.states.START_MODE, {
        /*
         *  All Intent Handlers for state : START_MODE
         */
        'LaunchRequest' : function () { new AudioController(this).launch(); },
        'Play' : function () { new AudioController(this).playStart(); },
        'Scan' : function () {
            var controller = new AudioController(this);

            // We emit a preface the first time they go into scan mode
            this.response.speak('At any time, just say Alexa Play Next to jump into a podcast');
            controller.scanStart();
        },
        'About' : function () { new AudioController(this).about(this); },
        'AMAZON.HelpIntent' : function () {
            var message = AudioManager.reprompt();
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        },
        'AMAZON.StopIntent' : function () {
            var message = 'Good bye.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'AMAZON.CancelIntent' : function () {
            var message = 'Good bye.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            var message = 'Sorry, I could not understand.' + AudioManager.reprompt();
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        }
    }),
    playModeIntentHandlers : Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
        /*
         *  All Intent Handlers for state : PLAY_MODE
         */
        'LaunchRequest' : function () {
            var controller = new AudioController(this);
            /*
             *  Session resumed in PLAY_MODE STATE.
             *  If playback had finished during last session :
             *      Give welcome message.
             *      Change state to START_STATE to restrict user inputs.
             *  Else :
             *      Ask user if he/she wants to resume from last position.
             *      Change state to RESUME_DECISION_MODE
             */
            var message;
            var reprompt;
            if (controller.playbackFinished) {
                controller.setState(constants.states.START_MODE);
                this.emit('LaunchRequest');
                return;
            } else {
                controller.setState(constants.states.RESUME_DECISION_MODE);
                var podcast = AudioManager.feed().item(controller.index);
                message = 'You were listening to ' + podcast.title +
                    ' Would you like to resume?';
                reprompt = 'You can say yes to resume or no to start from the top.';
                this.response.speak(message).listen(reprompt);
                this.emit(':responseReady');
            }
        },
        'AMAZON.NextIntent' : function () { new AudioController(this).playNext(); },
        'AMAZON.PreviousIntent' : function () { new AudioController(this).playPrevious(); },
        'AMAZON.PauseIntent' : function () { new AudioController(this).stop(); },
        'AMAZON.StopIntent' : function () { new AudioController(this).stop(); },
        'AMAZON.CancelIntent' : function () { new AudioController(this).stop(); },
        'AMAZON.ResumeIntent' : function () { new AudioController(this).play(); },
        'AMAZON.StartOverIntent' : function () { new AudioController(this).startOver(); },
        'AMAZON.HelpIntent' : function () {
            // This will called while audio is playing and a user says "ask <invocation_name> for help"
            var message = AudioManager.repromptPlay() +
                'At any time, you can say Pause to pause the audio and Resume to resume.';
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            var message = 'Sorry, I could not understand.' + AudioManager.repromptPlay();
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        }
    }),
    scanModeIntentHandlers : Alexa.CreateStateHandler(constants.states.SCAN_MODE, {
        /*
         *  All Intent Handlers for state : SCAN_MODE
         */
        'LaunchRequest' : function () {
            // We start over on launch after a scan
            var controller = new AudioController(this);
            controller.setState(constants.states.START_MODE);
            this.emit('LaunchRequest');
        },
        'AMAZON.NextIntent' : function () { new AudioController(this).scanInto(); },
        'AMAZON.PreviousIntent' : function () { new AudioController(this).scanPrevious(); },
        'AMAZON.PauseIntent' : function () { new AudioController(this).stop(); },
        'AMAZON.StopIntent' : function () { new AudioController(this).stop(); },
        'AMAZON.CancelIntent' : function () { new AudioController(this).stop(); },
        'AMAZON.ResumeIntent' : function () { new AudioController(this).launch(); },
        'AMAZON.StartOverIntent' : function () { new AudioController(this).startOver(); },
        'AMAZON.HelpIntent' : function () {
            // This will called while audio is playing and a user says "ask <invocation_name> for help"
            var message = AudioManager.repromptScan();
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            var message = 'Sorry, I could not understand. ' + AudioManager.repromptScan();
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        }
    }),
    remoteControllerHandlers : Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
        /*
         *  All Requests are received using a Remote Control. Calling corresponding handlers for each of them.
         */
        'PlayCommandIssued' : function () { new AudioController(this).playStart(); },
        'PauseCommandIssued' : function () { new AudioController(this).stop(); },
        'NextCommandIssued' : function () { new AudioController(this).playNext(); },
        'PreviousCommandIssued' : function () { new AudioController(this).playPrevious(); }
    }),
    resumeDecisionModeIntentHandlers : Alexa.CreateStateHandler(constants.states.RESUME_DECISION_MODE, {
        /*
         *  All Intent Handlers for state : RESUME_DECISION_MODE
         */
        'LaunchRequest' : function () {
            var controller = new AudioController(this);
            var podcast = AudioManager.feed().item(controller.index);
            var message = 'You were listening to ' + podcast.title + '. Would you like to resume?';
            var reprompt = 'You can say yes to resume or no to play from the top.';
            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'AMAZON.YesIntent' : function () { new AudioController(this).playStart(); },
        'AMAZON.NoIntent' : function () {
            var controller = new AudioController(this);
            controller.setState(constants.states.START_MODE);
            this.emit('LaunchRequest');
        },
        'AMAZON.HelpIntent' : function () {
            var controller = new AudioController(this);
            var podcast = AudioManager.feed().item(controller.index);

            var message = 'You were listening to ' + podcast.title +
                ' Would you like to resume?';
            var reprompt = 'You can say yes to resume or no to play from the top.';
            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'AMAZON.StopIntent' : function () {
            var message = 'Good bye.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'AMAZON.CancelIntent' : function () {
            var message = 'Good bye.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            var message = 'Sorry, this is not a valid command. Please say help to hear what you can say.';
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        }
    })
};

module.exports = stateHandlers;