var assert = require('assert');
var Verifier = require('../lib/verifier');

describe('Verifier', function() {
    describe('Verify Timestamp', function() {
        it('Verifies valid timestamp', function (done) {
            Verifier.verify(createEvent(0), createContext(false), function(error) {
                assert(!error);
                done();
            });
        });

        it('Verifies future timestamp close to edge', function (done) {
            Verifier.verify(createEvent(149), createContext(false), function(error) {
                assert(!error);
                done();
            });
        });

        it('Verifies future timestamp over the edge', function (done) {
            Verifier.verify(createEvent(151), createContext(false), function(error) {
                assert(error.startsWith("Invalid Timestamp"));
                done();
            });
        });

        it('Verifies old timestamp close to edge', function (done) {
            Verifier.verify(createEvent(-149), createContext(false), function(error) {
                assert(!error);
                done();
            });
        });

        it('Verifies old timestamp over the edge', function (done) {
            Verifier.verify(createEvent(-151), createContext(false), function(error) {
                assert(error.startsWith("Invalid Timestamp"));
                done();
            });
        });

    });

    describe('Verify Bad Signature', function() {
        it('Verifies bad signature', function (done) {
            Verifier.verify(createEvent(0), createContext(true), function(error) {
                assert(error);
                done();
            });
        });
    });
});

function createEvent(secondsOffset) {
    var timestamp = new Date();
    timestamp.setSeconds(timestamp.getSeconds() + secondsOffset);
    return event = {
        request: {
            timestamp: timestamp.toISOString()
        }
    };
}

function createContext(validateSignature) {
    Verifier.disableSignatureCheck = !validateSignature;

    return {
        request: {
            headers: {
                signaturecertchainurl: "Test",
                signature: "Stuff"
            }
        },
        body: new Buffer("Test"),
    };
}


