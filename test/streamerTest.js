var assert = require('assert');
var bst = require('bespoken-tools');

describe('Streamer', function() {
    var server = null;
    var alexa = null;

    beforeEach(function (done) {
        server = new bst.LambdaServer('./lib/index.js', 10000, false);
        alexa = new bst.BSTAlexa('http://localhost:10000',
            './speechAssets/IntentSchema.json',
            './speechAssets/Utterances.txt',
            'JPK');
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

    describe('Play Latest', function() {
        it('Launches and then plays first', function (done) {
            this.timeout(10000);

            alexa.launched(function (error, response) {
                //assert.equal(response.response.outputSpeech.ssml, '<speak> <audio src="https://s3.amazonaws.com/bespoken/streaming/WeStudyBillionaires-TheInvestorsPodcast-INTRODUCTION.mp3" /> </speak>');
                assert.equal(response.response.outputSpeech.ssml, '<speak> First, we like to have fun.  Second, we read and talk about the books that have influenced billionaires the most.   </speak>');
                alexa.spoken('Play', function (error, response) {
                    assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                    assert.equal(response.response.directives[0].audioItem.stream.token, '0');
                    assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/theinvestorspodcast/TIP_-_105_-_Mastermind_-_final_mp3.mp3?dest-id=223117')
                    done();
                });
            });
        });

        it('Plays', function (done) {
            this.timeout(10000);

            alexa.spoken('Play', function (error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                assert.equal(response.response.directives[0].audioItem.stream.token, '0');
                assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/theinvestorspodcast/TIP_-_105_-_Mastermind_-_final_mp3.mp3?dest-id=223117')
                done();
            });
        });

        it('Plays And Goes To Next', function (done) {
            this.timeout(10000);

            alexa.spoken('Play', function (error, response) {
                alexa.intended('AMAZON.NextIntent', null, function (error, response) {
                    // We want to make sure playback started
                    alexa.on('AudioPlayer.PlaybackStarted', function (audioItem) {
                        assert.equal(audioItem.stream.url, 'https://traffic.libsyn.com/theinvestorspodcast/TIP_-_104_-_King_Icahn_final_mp3.mp3?dest-id=223117')
                        done();
                    });

                    assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                    assert.equal(response.response.directives[0].audioItem.stream.token, '1');
                    assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/theinvestorspodcast/TIP_-_104_-_King_Icahn_final_mp3.mp3?dest-id=223117');
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
                    assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/theinvestorspodcast/TIP_103_-_final_mp3.mp3?dest-id=223117');
                    done();
                });
            });

        });
    });

    describe('Play Named', function() {
        it('Plays Named Podcast', function (done) {
            this.timeout(10000);

            alexa.spoken('Play {3}', function (error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                assert.equal(response.response.directives[0].audioItem.stream.token, '3');
                assert.equal(response.response.directives[0].audioItem.stream.url, 'https://traffic.libsyn.com/theinvestorspodcast/TIP102_final_mp3_with_new_intro_with_discount_code.mp3?dest-id=223117')
                done();
            });
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
