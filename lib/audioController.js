var AudioManager = require('./audioManager');
var constants = require('./constants');

var AudioController = function (handlerContext) {
    this.handlerContext = handlerContext;
    if (handlerContext.attributes['index'] === undefined) {
        this.initialize();
    } else {
        this.index = handlerContext.attributes['index'];
        this.offsetInMilliseconds = handlerContext.attributes['offsetInMilliseconds'];
        this.playbackFinished = handlerContext.attributes['playbackFinished'];
        this.playbackIndexChanged = handlerContext.attributes['playbackIndexChanged'];
        this.enqueuedToken = handlerContext.attributes['enqueuedToken'];
    }
};

AudioController.prototype.initialize = function () {
    this.index = 0;
    this.offsetInMilliseconds = 0;
    this.playbackFinished = false;
    this.playbackIndexChanged = false;
    this.enqueuedToken = false;
};

AudioController.prototype.launch = function () {
    this.setState(constants.states.START_MODE);

    let self = this;
    AudioManager.introductorySSML(function (ssml, reprompt) {
        self.saveAttributes();
        self.response().speak(ssml).listen(reprompt);
        self.emit(':responseReady');
    });
};

AudioController.prototype.play = function () {
    var self = this;

    this.setState(constants.states.PLAY_MODE);

    if (this.playbackFinished) {
        this.initialize();
    }

    var playBehavior = 'REPLACE_ALL';
    var podcast = AudioManager.feed().item(this.index);
    // We are always starting to play with nothing queued
    this.enqueuedToken = false;

    if (this.canThrowCard()) {
        var cardTitle = 'Playing ' + AudioManager.feed().title;
        var cardContent = 'Playing ' + podcast.title;
        this.handlerContext.response.cardRenderer(cardTitle, cardContent, {
            smallImageUrl: AudioManager.feed().cardURL(),
            largeImageUrl: AudioManager.feed().cardURL()
        });
    }

    this.saveAttributes();

    var token = this.index + "";
    this.response().audioPlayerPlay(playBehavior, podcast.audioURL, token, null, this.offsetInMilliseconds);
    this.emit(':responseReady');
};

AudioController.prototype.saveAttributes = function() {
    this.handlerContext.attributes['index'] = this.index;
    this.handlerContext.attributes['offsetInMilliseconds'] = this.offsetInMilliseconds;
    this.handlerContext.attributes['playbackFinished'] = this.playbackFinished;
    this.handlerContext.attributes['playbackIndexChanged'] = this.playbackIndexChanged;
    this.handlerContext.attributes['enqueuedToken'] = this.enqueuedToken;
};

AudioController.prototype.setState = function(state) {
    this.handlerContext.handler.state = state;
    // If we are setting it to start mode, need to force the session attributes to ''
    // This is because of a bug in the Alexa library where it does not update the state in the session when it is ''
    //  This is due to line 93 of response.js
    if (state === constants.states.START_MODE) {
        this.handlerContext.handler.response.sessionAttributes['STATE'] = constants.states.START_MODE;
    }
};

AudioController.prototype.response = function() {
    return this.handlerContext.response;
};

AudioController.prototype.emit = function(state) {
    this.handlerContext.emit(state);
};

AudioController.prototype.canThrowCard = function() {
    if (this.handlerContext.event.request.type === 'IntentRequest' && this.playbackIndexChanged) {
        this.playbackIndexChanged = false;
        return true;
    } else {
        return false;
    }
};

AudioController.prototype.scan = function() {
    this.index = 0;
    this.setState(constants.states.SCAN_MODE);
    this.scanUntilFound('REPLACE_ALL', null);
};

AudioController.prototype.scanUntilFound = function (playBehavior, previousToken) {
    var self = this;
    if (this.index === AudioManager.feed().length()) {
        this.index = 0;
    }

    var podcast = AudioManager.feed().item(this.index);
    podcast.scanAudioURL(function (error, url) {
        // We may not have a summary available for every podcast, if we do not, we skip to the next one
        if (url === null) {
            console.error("No summary available for: " + podcast.title);
            self.index += 1;
            self.scanUntilFound(previousToken);
        } else {
            self.saveAttributes();
            self.response().audioPlayerPlay(playBehavior, url, self.index + '', previousToken, 0);
            self.emit(':responseReady');
        }
    });
}

AudioController.prototype.playNext = function () {
    this.index += 1;
    // Check for last audio file.
    if (this.index === AudioManager.feed().length()) {
        this.index = 0;
    }
    this.offsetInMilliseconds = 0;
    this.playbackIndexChanged = true;
    this.play();
};

AudioController.prototype.playPrevious = function () {
    /*
     *  Called when AMAZON.PreviousIntent or PlaybackController.PreviousCommandIssued is invoked.
     *  Index is computed using token stored when AudioPlayer.PlaybackStopped command is received.
     *  If reached at the end of the playlist, choose behavior based on "loop" flag.
     */
    this.index -= 1;
    // Check for last audio file.
    if (this.index === -1) {
        this.index = AudioManager.feed().length() - 1;
    }
    this.offsetInMilliseconds = 0;
    this.playbackIndexChanged = true;
    this.play();
};

AudioController.prototype.scanInto = function () {
    this.offsetInMilliseconds = 0;
    this.playbackIndexChanged = true;
    this.play();
};

AudioController.prototype.scanPrevious = function () {
    this.index -= 1;
    // Check for last audio file.
    if (this.index === -1) {
        this.index = AudioManager.feed().length() - 1;
    }
    this.offsetInMilliseconds = 0;
    this.scan();
};

AudioController.prototype.stop = function () {
    /*
     *  Issuing AudioPlayer.Stop directive to stop the audio.
     *  Attributes already stored when AudioPlayer.Stopped request received.
     */
    this.response().audioPlayerStop();
    this.emit(':responseReady');
};

AudioController.prototype.about = function () {
    /*
     *  Issuing AudioPlayer.Stop directive to stop the audio.
     *  Attributes already stored when AudioPlayer.Stopped request received.
     */
    var self = this;
    AudioManager.aboutSSML(function(ssml, reprompt) {
        self.response().speak(ssml).listen(reprompt);
        self.emit(':responseReady');
    })
};

AudioController.prototype.startOver = function () {
    // Start over the current audio file.
    this.offsetInMilliseconds = 0;
    this.play();
};

    //     reset: function () {
    //         var self = this;
    //         // Reset to top of the playlist.
    //         this.attributes['index'] = 0;
    //         this.attributes['offsetInMilliseconds'] = 0;
    //         this.attributes['playbackIndexChanged'] = true;
    //
    //         var message = AudioManager.introductorySSML(function (ssml, reprompt) {
    //             self.response.speak(ssml).listen(reprompt);
    //             self.emit(':responseReady');
    //         });
    //     }
    // }

module.exports = AudioController;