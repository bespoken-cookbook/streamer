var alexaVerifier = require('alexa-verifier');

var Verifier = {
    verify: function(event, context, callback) {
        // None of this is necessary if this is just a straight lambda
        if (context.request === null) {
            callback();
        } else {
            // Verify timestamp first - must be within 150 seconds
            var timestamp = Date.parse(event.request.timestamp) / 1000;
            var now = new Date().getTime() / 1000;
            // Threshold is 150 seconds on either side
            if (timestamp + 150 < now || timestamp - 150 > now) {
                callback("Invalid Timestamp: " + event.request.timestamp + ". More than 150 seconds old");
                return;
            }

            // Verify the Alexa signature
            if (!context.disableSignatureCheck) {
                alexaVerifier(
                    context.request.headers.signaturecertchainurl,
                    context.request.headers.signature,
                    context.body,
                    function verificationCallback(error) {
                        if (error) {
                            callback("Signature Verification Failure: " + error.toString())
                        } else {
                            callback();
                        }
                    }
                );
            } else {
                callback();
            }
        }
    }
};

exports = module.exports = Verifier;
