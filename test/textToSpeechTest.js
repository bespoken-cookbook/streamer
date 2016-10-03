var assert = require('assert');
var TextToSpeech = require('../lib/textToSpeech');

describe('TextToSpeech', function() {
    // describe('#convert', function(done) {
    //     it("Converts Text To Speech", function(done) {
    //         this.timeout(10000);
    //         TextToSpeech.convertToSpeech('Hello there, ladies and gentlemen', null, function (error, url) {
    //             console.log('URL: ' + url);
    //             assert(url);
    //             done();
    //         });
    //     });
    // });

    describe('#convertAsMP3', function(done) {
        it("Converts Text To Speech As MP3", function(done) {
            this.timeout(30000);
            TextToSpeech.convertToSpeechAsMP3('HELLO-THERE-UNIT-TEST.mp3', 'Hello there, ladies and gentlemen', null, function (error, url) {
                assert(url, 'https://s3.amazonaws.com/bespoken/streaming/HELLO-THERE-UNIT-TEST.mp3');
                done();
            });
        });

        it("Converts Text To Speech As MP3 Using Cache", function(done) {
            this.timeout(10);
            TextToSpeech.convertToSpeechAsMP3('HELLO-THERE-UNIT-TEST.mp3', 'Hello there, ladies and gentlemen', null, function (error, url) {
                assert(url, 'https://s3.amazonaws.com/bespoken/streaming/HELLO-THERE-UNIT-TEST.mp3');
                done();
            });
        });

        it("Converts Text To Speech As MP3 With HTML", function(done) {
            this.timeout(30000);
            var text = "In Preston and Stig's 100th episode of The Investor's Podcast, they celebrate by cold calling a few members of their audience.  The members of the community can ask any question they want in an unscripted and open format.  Additionally, Preston and Stig talk about what their key take-aways were after studying billionaires and the market for 100 shows."
            TextToSpeech.convertToSpeechAsMP3('HTML-UNIT-TEST.mp3', text, null, function (error, url) {
                assert(url, 'https://s3.amazonaws.com/bespoken/streaming/HTML-UNIT-TEST.mp3');
                done();
            });
        });
    });

    describe('#checkStatus', function () {
        it("Checks Status", function(done) {
            this.timeout(10000);

            TextToSpeech.checkStatus(2, function(error, data) {
                console.log('CheckStatus Data: ' + data);
                done();
            });
        });
    });

    describe('#convertConvertSimpleResponse', function () {
        it("Converts Simple Response From XML to JS Object", function(done) {
            var xml = '<response resultCode="0" resultString="success" conversionNumber="2" status="Queued" statusCode="1"/>';

            TextToSpeech.convertConvertSimpleResponse(xml, function(error, data) {
                assert.equal(data.conversionNumber,  '2');
                done();
            });
        });
    });

    describe('#convertCheckStatusResponse', function () {
        it("Converts Check Status From XML to JS Object", function(done) {
            var xml = ' <response resultCode="0" resultString="success" status="Completed" statusCode="4" downloadUrl="http://media.neospeech.com/audio/ws/2016-10-03/0e6f67a368/result-37567393.wav"/>';

            TextToSpeech.convertCheckStatusResponse(xml, function(error, data) {
                assert.equal(data.downloadUrl,  'http://media.neospeech.com/audio/ws/2016-10-03/0e6f67a368/result-37567393.wav');
                done();
            });
        });
    });
});
