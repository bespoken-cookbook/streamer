var assert = require('assert');
var bst = require('bespoken-tools');

describe('Streamer', function() {
    var server = null;
    var emulator = null;

    beforeEach(function (done) {
        server = new bst.LambdaServer('./lib/index.js', 10000, true);
        emulator = new bst.BSTAlexa('http://localhost:10000',
            './speechAssets/IntentSchema.json',
            './speechAssets/Utterances.txt');
        server.start(function (error) {
            emulator.start(function (error) {
                if (error !== undefined) {
                    console.error("Error: " + error);
                } else {
                    done();
                }
            })
        });
    });

    afterEach(function(done) {
        emulator.stop(function () {
            server.stop(function () {
                done();
            });
        });
    });

    describe('#plays', function() {
        it('Starts and plays', function (done) {
            this.timeout(10000);

            emulator.on('response', function(response, request) {
                console.log("Received: " + request.request.type);
                if (request.request.type === 'AudioPlayer.PlaybackStarted') {
                    assert.equal(request.request.token, "0");
                    assert.equal(request.request.offsetInMilliseconds, 0);
                }

                if (request.request.type === 'AudioPlayer.PlaybackNearlyFinished') {
                    done();
                }
            });

            emulator.spoken('Play Haiku', function(error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
            });
        });

        it('Pauses and Resumes', function (done) {
            this.timeout(10000);

            emulator.spoken('Play Haiku', function(error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');

                emulator.on('response', function(response, request) {
                    console.log("Received: " + request.request.type);

                });

                emulator.intended('AMAZON.PauseIntent', null, function(error, response) {

                    assert.equal(response.response.directives[0].type, 'AudioPlayer.Stop');

                    let resuming = true;
                    emulator.intended('AMAZON.ResumeIntent', null, function(error, response) {
                        assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                        done();
                    });
                });
            });
        });

        it('Plays and Goes To Next', function (done) {
            this.timeout(10000);

            emulator.spoken('Play Haiku', function(error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                assert.equal(response.response.directives[0].audioItem.stream.token, '1');

                emulator.intended('AMAZON.NextIntent', null, function(error, response) {
                    assert.equal(response.response.directives[0].audioItem.stream.token, '2');
                    assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                    done();
                });
            });
        });

        it('Plays and Goes To Next And Back To Previous', function (done) {
            this.timeout(10000);

            emulator.spoken('Play Haiku', function(error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                assert.equal(response.response.directives[0].audioItem.stream.token, '1');

                emulator.intended('AMAZON.NextIntent');
                emulator.intended('AMAZON.PreviousIntent', null, function (error, response) {
                    assert.equal(response.response.directives[0].audioItem.stream.token, '1');
                    done();
                });
            });
        });

        it('Plays and Finishes Track And Goes To Next', function (done) {
            this.timeout(10000);

            emulator.spoken('Play Haiku', function(error, response) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                assert.equal(response.response.directives[0].audioItem.stream.token, '1');

                emulator.audioItemFinished();
                emulator.on('AudioPlayer.PlaybackStarted', function (audioItem) {
                    done();
                });
            });
        });
    });
});
