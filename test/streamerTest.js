var assert = require('assert');
var bst = require('bespoken-tools');

describe('Streamer', function() {
    var server = null;
    var alexa = null;

    beforeEach(function (done) {
        server = new bst.LambdaServer('./lib/index.js', 10000, true);
        alexa = new bst.BSTAlexa('http://localhost:10000',
            './speechAssets/IntentSchema.json',
            './speechAssets/Utterances.txt');
        server.start(function (error) {
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

    describe('#plays', function() {
        it('Launches and plays', function (done) {
            this.timeout(10000);

            alexa.launched(function(error, response) {
                assert.equal(response.response.outputSpeech.ssml, '<speak> <audio src="https://s3.amazonaws.com/bespoken/streaming/WeStudyBillionaires-TheInvestorsPodcast-INTRODUCTION.mp3" /> </speak>');
                done();
            });
        });

        // it('Starts and plays', function (done) {
        //     this.timeout(10000);
        //
        //     alexa.on('response', function(response, request) {
        //         console.log("Received: " + request.request.type);
        //         if (request.request.type === 'AudioPlayer.PlaybackStarted') {
        //             assert.equal(request.request.token, "0");
        //             assert.equal(request.request.offsetInMilliseconds, 0);
        //         }
        //
        //         if (request.request.type === 'AudioPlayer.PlaybackNearlyFinished') {
        //             done();
        //         }
        //     });
        //
        //     alexa.spoken('Play Haiku', function(error, response) {
        //         assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
        //     });
        // });
        //
        // it('Pauses and Resumes', function (done) {
        //     this.timeout(10000);
        //
        //     alexa.spoken('Play Haiku', function(error, response) {
        //         assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
        //
        //         alexa.on('response', function(response, request) {
        //             console.log("Received: " + request.request.type);
        //
        //         });
        //
        //         alexa.intended('AMAZON.PauseIntent', null, function(error, response) {
        //
        //             assert.equal(response.response.directives[0].type, 'AudioPlayer.Stop');
        //
        //             let resuming = true;
        //             alexa.intended('AMAZON.ResumeIntent', null, function(error, response) {
        //                 assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
        //                 done();
        //             });
        //         });
        //     });
        // });
        //
        // it('Plays and Goes To Next', function (done) {
        //     this.timeout(10000);
        //
        //     alexa.spoken('Play Haiku', function(error, response) {
        //         assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
        //         assert.equal(response.response.directives[0].audioItem.stream.token, '1');
        //
        //         alexa.intended('AMAZON.NextIntent', null, function(error, response) {
        //             assert.equal(response.response.directives[0].audioItem.stream.token, '2');
        //             assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
        //             done();
        //         });
        //     });
        // });
        //
        // it('Plays and Goes To Next And Back To Previous', function (done) {
        //     this.timeout(10000);
        //
        //     alexa.spoken('Play Haiku', function(error, response) {
        //         assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
        //         assert.equal(response.response.directives[0].audioItem.stream.token, '1');
        //
        //         alexa.intended('AMAZON.NextIntent');
        //         alexa.intended('AMAZON.PreviousIntent', null, function (error, response) {
        //             assert.equal(response.response.directives[0].audioItem.stream.token, '1');
        //             done();
        //         });
        //     });
        // });
        //
        // it('Plays and Finishes Track And Goes To Next', function (done) {
        //     this.timeout(10000);
        //
        //     alexa.spoken('Play Haiku', function(error, response) {
        //         assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
        //         assert.equal(response.response.directives[0].audioItem.stream.token, '1');
        //
        //         alexa.audioItemFinished();
        //         alexa.on('AudioPlayer.PlaybackStarted', function (audioItem) {
        //             done();
        //         });
        //     });
        // });
    });
});
