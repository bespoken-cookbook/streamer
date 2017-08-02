var assert = require('assert');
var bst = require('bespoken-tools');

describe('Streamer', function() {
    var server = null;
    var alexa = null;

    beforeEach(function (done) {
        server = new bst.LambdaServer('./lib/index.js', 10000, true);
        alexa = new bst.BSTAlexa('http://localhost:10000?disableSignatureCheck=true',
            './speechAssets/IntentSchema.json',
            './speechAssets/SampleUtterances.txt',
            'JPK');
        server.start(function () {
            alexa.start(function (error) {
                if (error !== undefined) {
                    console.error("Error: " + error);
                } else {
                    done();
                }
            })
        });
    });

    afterEach(function(done) {
        alexa.stop(function () {
            server.stop(function () {
                done();
            });
        });
    });

    describe('Play Latest', function() {
        it('Launches and then plays first', function (done) {
            this.timeout(10000);
            // Launch the skill via sending it a LaunchRequest
            alexa.launched(function (error, payload) {
                // Check that the introduction is play as outputSpeech
                assert.equal(payload.response.outputSpeech.ssml, '<speak> <audio src="https://s3.amazonaws.com/bespoken/streaming/bespokenspodcast-INTRODUCTION.mp3" />You can say play, scan titles, or about the podcast </speak>');

                // Emulate the user saying 'Play'
                alexa.spoken('Play', function (error, payload) {
                    // Ensure the correct directive and audioItem is returned
                    assert.equal(payload.response.directives[0].type, 'AudioPlayer.Play');
                    assert.equal(payload.response.directives[0].playBehavior, 'REPLACE_ALL');
                    assert.equal(payload.response.directives[0].audioItem.stream.token, '0');
                    assert(payload.response.directives[0].audioItem.stream.url.startsWith('https://traffic.libsyn.com/bespoken'));
                    done();
                });
            });
        });

        it('Plays', function (done) {
            this.timeout(10000);
            alexa.spoken('Play', function (error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                assert.equal(response.response.directives[0].audioItem.stream.token, '0');
                assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103.mp3?dest-id=432208')
                done();
            });
        });

        it('Plays To Completion', function (done) {
            this.timeout(10000);
            alexa.spoken('Play', function (error, payload) {
                // Emulates the track being played 'NearlyFinished'
                //  Alexa sends this event at some point during track playback
                // Our skill uses the opportunity to queue up the next track to play
                alexa.playbackNearlyFinished(function (error, payload) {
                    assert.equal(payload.response.directives[0].type, 'AudioPlayer.Play');
                    assert.equal(payload.response.directives[0].playBehavior, 'ENQUEUE');
                    assert.equal(payload.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP104.mp3?dest-id=432208');
                });

                // Emulates the track playing to completion
                // The callback is invoked after the skill responds to the PlaybackFinished request
                alexa.playbackFinished(function (error, payload) {
                    // Confirm there are no directives in the reply to the PlaybackFinished request
                    // They came on the PlaybackNearlyFinished call

                    // Check that playback started on the next track
                    alexa.once('AudioPlayer.PlaybackStarted', function(audioItem) {
                        assert.equal(audioItem.stream.token, '1');
                        assert.equal(audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP104.mp3?dest-id=432208');
                        done();
                    });
                });
            });
        });

        it('Plays And Goes To Next', function (done) {
            this.timeout(10000);

            // Open the skill directly with a 'Play' intent
            alexa.spoken('Play', function (error, payload) {
                // Confirms the correct directive is returned when the Intent is spoken
                assert.equal(payload.response.directives[0].type, 'AudioPlayer.Play');

                // We want to make sure playback started
                //  This request comes from the Alexa service AFTER the AudioPlayer.Play directive is received
                //  Once gets triggered a single time when the specified event occurs
                alexa.once('AudioPlayer.PlaybackStarted', function (audioItem) {
                    assert.equal(audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103.mp3?dest-id=432208')
                    done();
                });

                // Emulate the user saying 'Next'
                alexa.intended('AMAZON.NextIntent', null, function (error, response) {
                    assert.equal(payload.response.directives[0].type, 'AudioPlayer.Play');
                    assert.equal(payload.response.directives[0].audioItem.stream.token, '1');
                    assert.equal(payload.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP104.mp3?dest-id=432208');
                });
            });
        });

        it('Plays And Two Nexts', function (done) {
            this.timeout(10000);
            alexa.spoken('Play', function (error, response) {
                alexa.intended('AMAZON.NextIntent');

                alexa.intended('AMAZON.NextIntent', null, function (error, response) {
                    assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                    assert.equal(response.response.directives[0].audioItem.stream.token, '2');
                    assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP_-_105_-_Mastermind_-_final_mp3.mp3?dest-id=432208');
                    done();
                });
            });

        });

        it('Plays, Then Next, Then Previous', function (done) {
            this.timeout(10000);
            alexa.spoken('Play', function (error, response) {
                alexa.intended('AMAZON.NextIntent');

                alexa.intended('AMAZON.PreviousIntent', null, function (error, response) {
                    assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                    assert.equal(response.response.directives[0].audioItem.stream.token, '0');
                    assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103.mp3?dest-id=432208');
                    done();
                });
            });

        });

        it('Plays Then Stops', function (done) {
            this.timeout(10000);
            alexa.spoken('Play', function (error, response) {
                alexa.on('AudioPlayer.PlaybackStarted', function () {
                    alexa.intended('AMAZON.StopIntent', null, function (error, response) {
                        assert.equal(response.response.directives[0].type, 'AudioPlayer.Stop');
                        done();
                    });
                });
            });
        });

        it('Plays Then Starts Over', function (done) {
            this.timeout(10000);
            alexa.spoken('Play', function (error, response) {
                alexa.on('AudioPlayer.PlaybackStarted', function () {
                    alexa.playbackOffset(100);
                    alexa.playbackNearlyFinished(function (error, payload) {
                        alexa.intended('AMAZON.StartOverIntent', null, function (error, response) {
                            assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                            assert.equal(response.response.directives[0].audioItem.stream.offsetInMilliseconds, 0);
                            assert.equal(response.response.directives[0].audioItem.stream.token, "0");
                            done();
                        });
                    });

                });
            });
        });
    });

    describe('Scan', function() {
        it('Launches and Scans to First', function (done) {
            this.timeout(10000);
            alexa.launched(function (error, response) {
                alexa.spoken('Scan', function (error, response) {
                    assert.equal(response.response.outputSpeech.ssml, '<speak> At any time, just say Alexa Play Next to jump into a podcast </speak>');
                    assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                    assert.equal(response.response.directives[0].audioItem.stream.token, '0');
                    assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103-Summary.mp3');
                    alexa.intended('AMAZON.NextIntent', null, function (error, response) {
                        assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                        assert.equal(response.response.directives[0].audioItem.stream.token, '0');
                        assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103.mp3?dest-id=432208');
                        done();
                    });
                });
            });
        });

        it('Scans Past One And Then Plays', function (done) {
            this.timeout(10000);
            alexa.spoken('Scan', function (error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                assert.equal(response.response.directives[0].audioItem.stream.token, '0');
                assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103-Summary.mp3');
                alexa.once('AudioPlayer.PlaybackStarted', function () {
                    alexa.playbackNearlyFinished().playbackFinished();

                    alexa.once('AudioPlayer.PlaybackStarted', function (audioItem) {
                        assert.equal(audioItem.stream.token, '0-SILENCE');
                        assert.equal(audioItem.stream.url, 'https://s3.amazonaws.com/bespoken/encoded/SilenceTwoSeconds.mp3');
                        alexa.playbackNearlyFinished().playbackFinished();
                        alexa.once('AudioPlayer.PlaybackStarted', function () {
                            alexa.intended('AMAZON.NextIntent', null, function (request, response) {
                                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                                assert.equal(response.response.directives[0].audioItem.stream.token, '1');
                                assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP104.mp3?dest-id=432208');
                                done();
                            });
                        });
                    });
                });
            });
        });

        it('Scans Past One And Then Goes To Previous', function (done) {
            this.timeout(10000);
            alexa.spoken('Scan', function (error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                assert.equal(response.response.directives[0].audioItem.stream.token, '0');
                assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103-Summary.mp3');
                alexa.once('AudioPlayer.PlaybackStarted', function () {
                    alexa.playbackNearlyFinished().playbackFinished();

                    alexa.once('AudioPlayer.PlaybackStarted', function (audioItem) {
                        assert.equal(audioItem.stream.token, '0-SILENCE');
                        assert.equal(audioItem.stream.url, 'https://s3.amazonaws.com/bespoken/encoded/SilenceTwoSeconds.mp3');
                        alexa.playbackNearlyFinished().playbackFinished();
                        alexa.once('AudioPlayer.PlaybackStarted', function () {
                            alexa.intended('AMAZON.PreviousIntent', null, function (request, response) {
                                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                                assert.equal(response.response.directives[0].audioItem.stream.token, '0');
                                assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103-Summary.mp3');
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    describe('About', function() {
        it('Launches and Plays About', function (done) {
            this.timeout(10000);
            alexa.launched(function (error, response) {
                alexa.spoken('About the podcast', function (error, response) {
                    assert.equal(response.response.outputSpeech.ssml, '<speak> <audio src="https://s3.amazonaws.com/bespoken/streaming/bespokenspodcast-ABOUT.mp3" />You can say play, scan titles, or about the podcast </speak>');
                    assert(!response.response.directives);
                    done();
                });
            });
        });

    });

    describe('Resume', function() {
        it('Launches and then resumes', function (done) {
            this.timeout(10000);
            alexa.launched(function (error, response) {
                alexa.spoken('Play');
                alexa.once('AudioPlayer.PlaybackStarted', function () {
                    alexa.playbackOffset(1000);
                    alexa.intended('AMAZON.StopIntent', null, function () {
                        alexa.launched(function (error, response, request) {
                            assert.equal(request.session.new, true);
                            console.log('RESPONSE: ' + response.sessionAttributes['STATE']);
                            assert.equal(response.response.outputSpeech.ssml, '<speak> You were listening to TIP 103 : Life Inc. - Running your home finances like a business w/ Doug McCormick Would you like to resume? </speak>');
                            alexa.intended('AMAZON.YesIntent', null, function (error, response, request) {
                                assert.equal(request.session.attributes['STATE'], '_RESUME_DECISION_MODE');
                            });

                            alexa.once('AudioPlayer.PlaybackStarted', function(audioItem) {
                                assert.equal(audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103.mp3?dest-id=432208');
                                assert.equal(audioItem.stream.offsetInMilliseconds, 1000);
                                done();
                            });
                        });
                    });
                });
            });
        });

        it('Launches and does not resume', function (done) {
            this.timeout(10000);
            alexa.launched(function (error, response) {
                alexa.spoken('Play');
                alexa.once('AudioPlayer.PlaybackStarted', function () {
                    alexa.intended('AMAZON.StopIntent', null, function () {
                        alexa.launched(function (error, response, request) {
                            assert.equal(request.session.new, true);
                            assert.equal(response.response.outputSpeech.ssml, '<speak> You were listening to TIP 103 : Life Inc. - Running your home finances like a business w/ Doug McCormick Would you like to resume? </speak>');
                            assert.equal(response.sessionAttributes['STATE'], '_RESUME_DECISION_MODE');

                            alexa.intended('AMAZON.NoIntent', null, function (error, response, request) {
                                assert.equal(request.session.attributes['STATE'], '_RESUME_DECISION_MODE');
                                assert.equal(response.sessionAttributes['STATE'], '');
                                assert.equal(response.response.outputSpeech.ssml, '<speak> <audio src="https://s3.amazonaws.com/bespoken/streaming/bespokenspodcast-INTRODUCTION.mp3" />You can say play, scan titles, or about the podcast </speak>');
                                done();
                            });
                        });
                    });
                });
            });
        });

        it('Launches and does not go to resume on scan', function (done) {
            this.timeout(10000);
            alexa.launched(function (error, response) {
                alexa.spoken('Scan');
                alexa.once('AudioPlayer.PlaybackStarted', function () {
                    alexa.intended('AMAZON.StopIntent', null, function () {
                        alexa.launched(function (error, response, request) {
                            assert.equal(request.session.new, true);
                            assert.equal(response.response.outputSpeech.ssml, '<speak> <audio src=\"https://s3.amazonaws.com/bespoken/streaming/bespokenspodcast-INTRODUCTION.mp3\" />You can say play, scan titles, or about the podcast </speak>');
                            assert.equal(response.sessionAttributes['STATE'], '');
                            alexa.spoken('Play', function(error, response){
                                console.log("response: " + response);
                                done();
                            });

                        });
                    });
                });
            });
        });
    });
});
