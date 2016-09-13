var assert = require('assert');
var bst = require('bespoken-tools');

describe('Streamer', function() {
    describe('#plays', function() {
        it('Starts and plays', function (done) {
            var runner = new bst.LambdaRunner('./lib/index.js', 10000);
            var alexa = new bst.BSTSpeak('http://localhost:10000',
                './speechAssets/IntentSchema.json',
                './speechAssets/Utterances.txt',
                null);
            runner.start(function (error) {
                alexa.initialize(function (error) {
                    if (error !== undefined) {
                        console.error("Error: " + error);
                    }

                    // alexa.on(bst.AudioPlayer.RequestPlaybackNearlyFinished, function (request: any, response: any) {
                    //
                    // });

                    alexa.speak('Play Haiku', function(request, response, error) {
                        assert.equal(response.response.directives[0].type, 'AudioPlayer.Play');
                        done();
                    });
                });

            });

        });
    });
});
