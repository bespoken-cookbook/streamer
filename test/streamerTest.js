var assert = require('assert');
var bst = require('bespoken-tools');

describe('Streamer', function() {
    var runner = null;
    var emulator = null;

    beforeEach(function (done) {
        runner = new bst.LambdaRunner('./lib/index.js', 10000, false);
        emulator = new bst.BSTSpeak('http://localhost:10000',
            './speechAssets/IntentSchema.json',
            './speechAssets/Utterances.txt',
            null);
        runner.start(function (error) {
            emulator.initialize(function (error) {
                if (error !== undefined) {
                    console.error("Error: " + error);
                } else {
                    done();
                }
            })
        });
    });

    afterEach(function(done) {
        emulator.shutdown(function () {
            runner.stop(function () {
                done();
            });
        });
    });

    describe('#plays', function() {
        // it('Starts and plays', function (done) {
        //     this.timeout(10000);
        //
        //     emulator.onSkillResponse(function(request, response) {
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
        //     emulator.spoken('Play Haiku', function(request, response, error) {
        //         assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
        //     });
        // });

        it('Pauses and Resumes', function (done) {
            this.timeout(10000);

            emulator.spoken('Play Haiku', function(request, response, error) {
                assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');

                emulator.onSkillResponse(function(request, response) {
                    console.log("Received: " + request.request.type);

                });

                emulator.intended('AMAZON.PauseIntent', null, function(request, response, error) {

                    assert.equal(response.response.directives[0].type, 'AudioPlayer.Stop');

                    let resuming = true;
                    emulator.intended('AMAZON.ResumeIntent', null, function(request, response, error) {
                        assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                        done();
                    });
                });
            });



        });
    });
});
