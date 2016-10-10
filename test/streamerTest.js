var assert = require('assert');
var bst = require('bespoken-tools');

describe('Streamer', function() {
    var server = null;
    var alexa = null;

    beforeEach(function (done) {
        server = new bst.LambdaServer('./lib/index.js', 10000, true);
        alexa = new bst.BSTAlexa('http://localhost:10000',
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
            alexa.launched(function (error, response) {
                //assert.equal(response.response.outputSpeech.ssml, '<speak> <audio src="https://s3.amazonaws.com/bespoken/streaming/WeStudyBillionaires-TheInvestorsPodcast-INTRODUCTION.mp3" /> </speak>');
                assert.equal(response.response.outputSpeech.ssml, '<speak> <audio src="https://s3.amazonaws.com/bespoken/streaming/bespokenspodcast-INTRODUCTION.mp3" />You can say play, scan titles, or about the podcast </speak>');
                alexa.spoken('Play', function (error, response) {
                    assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                    assert.equal(response.response.directives[0].audioItem.stream.token, '0');
                    assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103.mp3?dest-id=432208');
                    done();
                });
            });
        });

        it('Plays', function (done) {
            alexa.spoken('Play', function (error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                assert.equal(response.response.directives[0].audioItem.stream.token, '0');
                assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103.mp3?dest-id=432208')
                done();
            });
        });

        it('Plays And Goes To Next', function (done) {
            alexa.spoken('Play', function (error, response) {
                // We want to make sure playback started
                alexa.on('AudioPlayer.PlaybackStarted', function (audioItem) {
                    assert.equal(audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103.mp3?dest-id=432208')
                    done();
                });

                alexa.intended('AMAZON.NextIntent', null, function (error, response) {
                    assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                    assert.equal(response.response.directives[0].audioItem.stream.token, '1');
                    assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP104.mp3?dest-id=432208');
                });
            });

        });

        it('Plays And Two Nexts', function (done) {
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
    });

    describe('Play Named', function() {
        it('Plays Named Podcast', function (done) {
            alexa.spoken('Play {3}', function (error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                assert.equal(response.response.directives[0].audioItem.stream.token, '2');
                assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP_-_105_-_Mastermind_-_final_mp3.mp3?dest-id=432208');
                done();
            });
        });
    });

    describe('Scan', function() {
        it('Launches and Scans to First', function (done) {
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

        it('Launches and Scans to First', function (done) {
            alexa.spoken('Scan', function (error, response) {
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

        it('Scans Past One And Then Plays', function (done) {
            alexa.spoken('Scan', function (error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                assert.equal(response.response.directives[0].audioItem.stream.token, '0');
                assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/bespoken/TIP103-Summary.mp3');
                alexa.once('AudioPlayer.PlaybackStarted', function () {
                    alexa.playbackNearlyFinished();
                    alexa.playbackFinished(function () {
                        alexa.intended('AMAZON.NextIntent', null, function (error, response) {
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

    describe('About', function() {
        it('Launches and Plays About', function (done) {
            this.timeout(5000);
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
    });
});
