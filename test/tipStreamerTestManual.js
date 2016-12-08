var assert = require('assert');
var bst = require('bespoken-tools');

// This changes frequently based on update to the RSS feed
// It is very useful, so we keep it around, but not part of npm test
describe('TIP Streamer', function() {
    var server = null;
    var alexa = null;

    beforeEach(function (done) {
        server = new bst.LambdaServer('./lib/index.js', 10000, true);
        alexa = new bst.BSTAlexa('http://localhost:10000?rssURL=http://theinvestorspodcast.libsyn.com/rss',
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
        this.timeout(5000);
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
                assert.equal(payload.response.outputSpeech.ssml, '<speak> <audio src="https://s3.amazonaws.com/bespoken/streaming/WeStudyBillionairesTheInvestorsPodcast-INTRODUCTION.mp3" /><audio src="https://s3.amazonaws.com/bespoken/streaming/WeStudyBillionairesTheInvestorsPodcast-PROMPT.mp3" /> </speak>');

                // Emulate the user saying 'Play'
                alexa.spoken('Play', function (error, payload) {
                    // Ensure the correct directive and audioItem is returned
                    assert.equal(payload.response.card.image.smallImageUrl, 'https://s3.amazonaws.com/bespoken/TIP/SmallCard.jpg');
                    assert.equal(payload.response.directives[0].type, 'AudioPlayer.Play');
                    assert.equal(payload.response.directives[0].playBehavior, 'REPLACE_ALL');
                    assert.equal(payload.response.directives[0].audioItem.stream.token, '0');
                    assert(payload.response.directives[0].audioItem.stream.url.startsWith('https://traffic.libsyn.com/theinvestorspodcast/TIP'));
                    done();
                });
            });
        });
    });

    describe('Scan', function() {
        it('Launches and Scans to First', function (done) {
            this.timeout(30000);
            alexa.launched(function (error, response) {
                alexa.spoken('Scan', function (error, response) {
                    assert.equal(response.response.outputSpeech.ssml, '<speak> At any time, just say Alexa Play Next to jump into a podcast </speak>');
                    assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                    assert.equal(response.response.directives[0].audioItem.stream.token, '2');
                    assert.equal(response.response.directives[0].audioItem.stream.url, 'https://s3.amazonaws.com/bespoken/TIP/EP108.mp3');
                    alexa.intended('AMAZON.NextIntent', null, function (error, response) {
                        assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                        assert.equal(response.response.directives[0].playBehavior, 'REPLACE_ALL');
                        assert.equal(response.response.directives[0].audioItem.stream.token, '2');
                        assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/theinvestorspodcast/TIP_-_108_-_The_Outsiders_-_final_mp3.mp3?dest-id=223117');
                        done();
                    });
                });
            });
        });

        it('Launches and does not go to resume on scan', function (done) {
            this.timeout(30000);
            alexa.launched(function (error, response) {
                alexa.spoken('Scan');
                alexa.once('AudioPlayer.PlaybackStarted', function () {
                    alexa.intended('AMAZON.StopIntent', null, function () {
                        alexa.launched(function (error, response, request) {
                            assert.equal(request.session.new, true);
                            assert.equal(response.response.outputSpeech.ssml, '<speak> <audio src="https://s3.amazonaws.com/bespoken/streaming/WeStudyBillionairesTheInvestorsPodcast-INTRODUCTION.mp3" /><audio src="https://s3.amazonaws.com/bespoken/streaming/WeStudyBillionairesTheInvestorsPodcast-PROMPT.mp3" /> </speak>');
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

        it('Scans Past One And Then Goes To Previous', function (done) {
            this.timeout(30000);
            alexa.spoken('Scan', function (error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                assert.equal(response.response.directives[0].audioItem.stream.token, '2');
                assert.equal(response.response.directives[0].audioItem.stream.url, 'https://s3.amazonaws.com/bespoken/TIP/EP108.mp3');
                alexa.once('AudioPlayer.PlaybackStarted', function () {
                    alexa.playbackNearlyFinished().playbackFinished();

                    alexa.once('AudioPlayer.PlaybackStarted', function (audioItem) {
                        assert.equal(audioItem.stream.token, '2-SILENCE');
                        assert.equal(audioItem.stream.url, 'https://s3.amazonaws.com/bespoken/encoded/SilenceTwoSeconds.mp3');
                        alexa.playbackNearlyFinished().playbackFinished();
                        alexa.once('AudioPlayer.PlaybackStarted', function () {
                            alexa.intended('AMAZON.PreviousIntent', null, function (request, response) {
                                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                                assert.equal(response.response.directives[0].audioItem.stream.token, '2');
                                assert.equal(response.response.directives[0].audioItem.stream.url, 'https://s3.amazonaws.com/bespoken/TIP/EP108.mp3');
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
            this.timeout(30000);
            alexa.launched(function (error, response) {
                alexa.spoken('About the podcast', function (error, response) {
                    assert.equal(response.response.outputSpeech.ssml, '<speak> <audio src="https://s3.amazonaws.com/bespoken/streaming/WeStudyBillionairesTheInvestorsPodcast-INTRODUCTION.mp3" />You can say play, scan titles, or about the podcast </speak>');
                    assert(!response.response.directives);
                    done();
                });
            });
        });

    });
});
