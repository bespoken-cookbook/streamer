'use strict';

var Alexa = require('alexa-sdk');
var AudioManager = require('./audioManager');
var constants = require('./constants');

var stateHandlers = {
    startModeIntentHandlers : Alexa.CreateStateHandler(constants.states.START_MODE, {
        /*
         *  All Intent Handlers for state : START_MODE
         */
        'LaunchRequest' : function () {
            // Initialize Attributes
            this.attributes['playOrder'] = Array.apply(null, {length: AudioManager.feed().length()}).map(Number.call, Number);
            this.attributes['index'] = 0;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['loop'] = true;
            this.attributes['shuffle'] = false;
            this.attributes['playbackIndexChanged'] = true;
            //  Change state to START_MODE
            this.handler.state = constants.states.START_MODE;

            let self = this;
            AudioManager.introductorySSML(function (ssml, reprompt) {
                self.response.speak(ssml).listen(reprompt);
                self.emit(':responseReady');
            });

        },
        'Play' : function () {
            var jumpToIndex = null;
            if (this.event.request.intent.slots.feedItem.value !== undefined) {
                jumpToIndex = this.event.request.intent.slots.feedItem.value - 1;
            }

            if (!this.attributes['playOrder']) {
                // Initialize Attributes if undefined.
                this.attributes['playOrder'] = Array.apply(null, {length: AudioManager.feed().length()}).map(Number.call, Number);
                this.attributes['index'] = 0;
                this.attributes['offsetInMilliseconds'] = 0;
                this.attributes['loop'] = true;
                this.attributes['shuffle'] = false;
                this.attributes['playbackIndexChanged'] = true;
                this.attributes['scan'] = false;
                //  Change state to START_MODE
                this.handler.state = constants.states.START_MODE;
            }
            controller.play.call(this, jumpToIndex);
        },
        'Scan' : function () {
            if (!this.attributes['playOrder']) {
                // Initialize Attributes if undefined.
                this.attributes['playOrder'] = Array.apply(null, {length: AudioManager.feed().length()}).map(Number.call, Number);
                this.attributes['index'] = 0;
                this.attributes['offsetInMilliseconds'] = 0;
                this.attributes['loop'] = true;
                this.attributes['shuffle'] = false;
                this.attributes['playbackIndexChanged'] = true;
                //  Change state to START_MODE
                this.handler.state = constants.states.START_MODE;
            }

            this.attributes['scan'] = true;

            // We emit a preface the first time they go into scan mode
            this.response.speak('At any time, just say Alexa Play Next to jump into a podcast');
            controller.play.call(this);
        },
        'About' : function () {
            controller.about.call(this);
        },
        'AMAZON.HelpIntent' : function () {
            var message = 'Welcome to the AWS Podcast. You can say, play the audio, to begin the podcast.';
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
            console.log('HereStarted' + AudioManager.play);
            if (AudioManager.play) {
                this.emit('PlayAudio');
            } else {
                var message = overrideMessage('Sorry, I could not understand. Please say, play the audio, to begin the audio.');
                this.response.speak(message).listen(message);
                this.emit(':responseReady');
            }

        }
    }),
    playModeIntentHandlers : Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
        /*
         *  All Intent Handlers for state : PLAY_MODE
         */
        'LaunchRequest' : function () {
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
            if (this.attributes['playbackFinished']) {
                this.handler.state = constants.states.START_MODE;
                message = 'Welcome to the AWS Podcast. You can say, play the audio to begin the podcast.';
                reprompt = 'You can say, play the audio, to begin.';
            } else if (this.attributes['scan']) {
                // If we are in scan mode, do not do the resume logic
                this.attributes['scan'] = false;
                resetState(this.handler);
                this.emit('LaunchRequest');
                return;
            } else {
                this.handler.state = constants.states.RESUME_DECISION_MODE;
                var podcast = AudioManager.feed().items[this.attributes['playOrder'][this.attributes['index']]];
                message = 'You were listening to ' + podcast.title +
                    ' Would you like to resume?';
                reprompt = 'You can say yes to resume or no to play from the top.';

            }

            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'PlayAudio' : function () { controller.play.call(this) },
        'AMAZON.NextIntent' : function () { controller.playNext.call(this, true) },
        'AMAZON.PreviousIntent' : function () { controller.playPrevious.call(this) },
        'AMAZON.PauseIntent' : function () { controller.stop.call(this) },
        'AMAZON.StopIntent' : function () { controller.stop.call(this) },
        'AMAZON.CancelIntent' : function () { controller.stop.call(this) },
        'AMAZON.ResumeIntent' : function () { controller.play.call(this) },
        'AMAZON.LoopOnIntent' : function () { controller.loopOn.call(this) },
        'AMAZON.LoopOffIntent' : function () { controller.loopOff.call(this) },
        'AMAZON.ShuffleOnIntent' : function () { controller.shuffleOn.call(this) },
        'AMAZON.ShuffleOffIntent' : function () { controller.shuffleOff.call(this) },
        'AMAZON.StartOverIntent' : function () { controller.startOver.call(this) },
        'AMAZON.HelpIntent' : function () {
            // This will called while audio is playing and a user says "ask <invocation_name> for help"
            var message = 'You are listening to the AWS Podcast. You can say, Next or Previous to navigate through the playlist. ' +
                'At any time, you can say Pause to pause the audio and Resume to resume.';
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            console.log('HerePlaying');

            if (AudioManager.play) {
                this.emit('PlayAudio');
            } else {
                var message = overrideMessage('Sorry, I could not understand. You can say, Next or Previous to navigate through the playlist.');
                this.response.speak(message).listen(message);
                this.emit(':responseReady');
            }
        }
    }),
    remoteControllerHandlers : Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
        /*
         *  All Requests are received using a Remote Control. Calling corresponding handlers for each of them.
         */
        'PlayCommandIssued' : function () { controller.play.call(this) },
        'PauseCommandIssued' : function () { controller.stop.call(this) },
        'NextCommandIssued' : function () { controller.playNext.call(this, true) },
        'PreviousCommandIssued' : function () { controller.playPrevious.call(this) }
    }),
    resumeDecisionModeIntentHandlers : Alexa.CreateStateHandler(constants.states.RESUME_DECISION_MODE, {
        /*
         *  All Intent Handlers for state : RESUME_DECISION_MODE
         */
        'LaunchRequest' : function () {
            var message = 'You were listening to ' + AudioManager.feed().items[this.attributes['playOrder'][this.attributes['index']]].title +
                ' Would you like to resume?';
            var reprompt = 'You can say yes to resume or no to play from the top.';
            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'AMAZON.YesIntent' : function () { controller.play.call(this) },
        'AMAZON.NoIntent' : function () {
            resetState(this.handler);
            controller.reset.call(this)
        },
        'AMAZON.HelpIntent' : function () {
            var message = 'You were listening to ' + AudioManager.feed().items[this.attributes['index']].title +
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
            if (AudioManager.play) {
                this.emit('PlayAudio');
            } else {
                var message = overrideMessage('Sorry, this is not a valid command. Please say help to hear what you can say.');
                this.response.speak(message).listen(message);
                this.emit(':responseReady');
            }
        }
    })
};

module.exports = stateHandlers;

var controller = function () {
    return {
        play: function (jumpToIndex) {
            var self = this;
            /*
             *  Using the function to begin playing audio when:
             *      Play Audio intent invoked.
             *      Resuming audio when stopped/paused.
             *      Next/Previous commands issued.
             */
            this.handler.state = constants.states.PLAY_MODE;

            if (jumpToIndex !== undefined && jumpToIndex !== null) {
                // Reset to top of the playlist when reached end.
                this.attributes['index'] = jumpToIndex;
                this.attributes['offsetInMilliseconds'] = 0;
                this.attributes['playbackIndexChanged'] = true;
                this.attributes['playbackFinished'] = false;
            } else if (this.attributes['playbackFinished']) {
                // Reset to top of the playlist when reached end.
                this.attributes['index'] = 0;
                this.attributes['offsetInMilliseconds'] = 0;
                this.attributes['playbackIndexChanged'] = true;
                this.attributes['playbackFinished'] = false;
            }

            var token = String(this.attributes['playOrder'][this.attributes['index']]);
            var playBehavior = 'REPLACE_ALL';
            var podcast = AudioManager.feed().items[this.attributes['playOrder'][this.attributes['index']]];
            var offsetInMilliseconds = this.attributes['offsetInMilliseconds'];
            // Since play behavior is REPLACE_ALL, enqueuedToken attribute need to be set to null.
            this.attributes['enqueuedToken'] = null;

            var scan = this.attributes['scan'];
            if (!scan && canThrowCard.call(this)) {
                var cardTitle = 'Playing ' + AudioManager.feed().title;
                var cardContent = 'Playing ' + podcast.title;
                this.response.cardRenderer(cardTitle, cardContent, {
                    smallImageUrl: AudioManager.feed().cardURL(),
                    largeImageUrl: AudioManager.feed().cardURL()
                });
            }

            if (scan) {
                podcast.scanAudioURL(function (error, url) {
                    // We may not have a summary available for every podcast, if we do not, we skip to the next one
                    if (url === null) {
                        console.error("No summary available for: " + podcast.title);
                        controller.playNext.call(self, false)
                    } else {
                        self.response.audioPlayerPlay(playBehavior, url, token, null, offsetInMilliseconds);
                        self.emit(':responseReady');
                    }
                });
            } else {
                this.response.audioPlayerPlay(playBehavior, podcast.audioURL, token, null, offsetInMilliseconds);
                this.emit(':responseReady');
            }

        },
        stop: function () {
            /*
             *  Issuing AudioPlayer.Stop directive to stop the audio.
             *  Attributes already stored when AudioPlayer.Stopped request received.
             */
            this.response.audioPlayerStop();
            this.emit(':responseReady');
        },
        about: function () {
            var self = this;
            /*
             *  Issuing AudioPlayer.Stop directive to stop the audio.
             *  Attributes already stored when AudioPlayer.Stopped request received.
             */
            AudioManager.aboutSSML(function(ssml, reprompt) {
                self.response.speak(ssml).listen(reprompt);
                self.emit(':responseReady');
            })
        },
        playNext: function (stopScanning) {
            /*
             *  Called when AMAZON.NextIntent or PlaybackController.NextCommandIssued is invoked.
             *  Index is computed using token stored when AudioPlayer.PlaybackStopped command is received.
             *  If reached at the end of the playlist, choose behavior based on "loop" flag.
             *
             *  Stop scanning means that this was uttered on a scan and it should go to the full podcast.
             *
             *  It also possible to do a playNext for the next summary, it depends on how the flag stopScanning is set
             */
            var index = this.attributes['index'];
            if (stopScanning && this.attributes['scan']) {
                this.attributes['scan'] = false;
                controller.play.call(this, index);
                return;
            }

            index += 1;
            // Check for last audio file.
            if (index === AudioManager.feed().length()) {
                if (this.attributes['loop']) {
                    index = 0;
                } else {
                    // Reached at the end. Thus reset state to start mode and stop playing.
                    this.handler.state = constants.states.START_MODE;

                    var message = 'You have reached at the end of the playlist.';
                    this.response.speak(message).audioPlayerStop();
                    return this.emit(':responseReady');
                }
            }
            // Set values to attributes.
            this.attributes['index'] = index;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['playbackIndexChanged'] = true;

            controller.play.call(this);
        },
        playPrevious: function () {
            /*
             *  Called when AMAZON.PreviousIntent or PlaybackController.PreviousCommandIssued is invoked.
             *  Index is computed using token stored when AudioPlayer.PlaybackStopped command is received.
             *  If reached at the end of the playlist, choose behavior based on "loop" flag.
             */
            var index = this.attributes['index'];
            index -= 1;
            // Check for last audio file.
            if (index === -1) {
                if (this.attributes['loop']) {
                    index = AudioManager.feed().length() - 1;
                } else {
                    // Reached at the end. Thus reset state to start mode and stop playing.
                    this.handler.state = constants.states.START_MODE;

                    var message = 'You have reached at the start of the playlist.';
                    this.response.speak(message).audioPlayerStop();
                    return this.emit(':responseReady');
                }
            }
            // Set values to attributes.
            this.attributes['index'] = index;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['playbackIndexChanged'] = true;

            controller.play.call(this);
        },
        loopOn: function () {
            // Turn on loop play.
            this.attributes['loop'] = true;
            var message = 'Loop turned on.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        loopOff: function () {
            // Turn off looping
            this.attributes['loop'] = false;
            var message = 'Loop turned off.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        shuffleOn: function () {
            // Turn on shuffle play.
            this.attributes['shuffle'] = true;
            shuffleOrder((newOrder) => {
                // Play order have been shuffled. Re-initializing indices and playing first song in shuffled order.
                this.attributes['playOrder'] = newOrder;
                this.attributes['index'] = 0;
                this.attributes['offsetInMilliseconds'] = 0;
                this.attributes['playbackIndexChanged'] = true;
                controller.play.call(this);
            });
        },
        shuffleOff: function () {
            // Turn off shuffle play. 
            if (this.attributes['shuffle']) {
                this.attributes['shuffle'] = false;
                // Although changing index, no change in audio file being played as the change is to account for reordering playOrder
                this.attributes['index'] = this.attributes['playOrder'][this.attributes['index']];
                this.attributes['playOrder'] = Array.apply(null, {length: AudioManager.feed().length()}).map(Number.call, Number);
            }
            controller.play.call(this);
        },
        startOver: function () {
            // Start over the current audio file.
            this.attributes['offsetInMilliseconds'] = 0;
            controller.play.call(this);
        },
        reset: function () {
            var self = this;
            // Reset to top of the playlist.
            this.attributes['index'] = 0;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['playbackIndexChanged'] = true;

            var message = AudioManager.introductorySSML(function (ssml, reprompt) {
                self.response.speak(ssml).listen(reprompt);
                self.emit(':responseReady');
            });
        }
    }
}();

function overrideMessage(message) {
    if (AudioManager.ssml !== undefined && AudioManager.ssml !== null) {
        message = AudioManager.ssml;
    }
    return message;
}

function canThrowCard() {
    /*
     * To determine when can a card should be inserted in the response.
     * In response to a PlaybackController Request (remote control events) we cannot issue a card,
     * Thus adding restriction of request type being "IntentRequest".
     */
    if (this.event.request.type === 'IntentRequest' && this.attributes['playbackIndexChanged']) {
        this.attributes['playbackIndexChanged'] = false;
        return true;
    } else {
        return false;
    }
}

function shuffleOrder(callback) {
    // Algorithm : Fisher-Yates shuffle
    var array = Array.apply(null, {length: AudioManager.audioAssets().length}).map(Number.call, Number);
    var currentIndex = array.length;
    var temp, randomIndex;

    while (currentIndex >= 1) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temp = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temp;
    }
    callback(array);
}

function resetState(handler) {
    handler.state = constants.states.START_MODE;
    handler.response.sessionAttributes['STATE'] = handler.state;
}