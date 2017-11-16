'use strict';

// We use mockery so that we can bypass Dynamo by default
var mockery = require('mockery');
var AWS = require('aws-sdk');

setupDynamo();

var Alexa = require('alexa-sdk');
var constants = require('./constants');
var stateHandlers = require('./stateHandlers');
var audioEventHandlers = require('./audioEventHandlers');
var AudioManager = require('./audioManager');
var qs = require('querystring');
var bst = require('bespoken-tools');
var Verifier = require('./verifier');

// Initial entry point, and checks the signature if necessary
var handler = function(event, context) {
    var rssURL = 'https://rss.art19.com/the-investors-podcast';
    console.log('Sanity Check');

    // If this came from an HTTP service, let's look at the query string
    if (context.request !== null && context.request.url.indexOf('?') !== -1) {
        var qsString = context.request.url.substring(context.request.url.indexOf("?") + 1);
        var params = qs.parse(qsString);

        var appID = null;
        if (params['appID'] !== undefined) {
            appID = params['appID'];
        }

        Verifier.disableSignatureCheck = false;
        if (params['disableSignatureCheck'] !== undefined) {
            Verifier.disableSignatureCheck = true;
        }

        Verifier.verify(event, context, function (error) {
            if (error) {
                responseForInvalid(context, error);
            } else {
                process(event, context, appID, rssURL);
            }
        });
    } else {
        process(event, context, null, rssURL);
    }
};

function process (event, context, appID, rssURL) {
    var alexa = Alexa.handler(event, context);
    if (appID !== null) {
        alexa.appId = appID;
    }
    alexa.dynamoDBTableName = constants.dynamoDBTableName;
    alexa.registerHandlers(
        stateHandlers.startModeIntentHandlers,
        stateHandlers.playModeIntentHandlers,
        stateHandlers.scanModeIntentHandlers,
        stateHandlers.remoteControllerHandlers,
        stateHandlers.resumeDecisionModeIntentHandlers,
        audioEventHandlers.playHandler,
        audioEventHandlers.scanHandler
    );

    if (alexa.state === null || alexa.state === '') {
        alexa.state = constants.states.START_MODE;
    }

    if (event.context !== undefined && event.context.System.device.supportedInterfaces.AudioPlayer === undefined) {
        alexa.emit(':tell', 'Sorry, this skill is not supported on this device');
    } else {
        // The resources are loaded once and then cached, but this is done asynchronously
        //AudioManager.load("XAPP", xapp, {environment: environment}, intentName, function (error) {
        AudioManager.load('URL', rssURL, 60, function (error, feed) {
            if (error !== undefined && error !== null) {
                context.fail(error);
            } else {
                alexa.execute();
            }
        });
    }
}

function responseForInvalid(context, error) {
    console.error("Failed Validation: " + error);
    context.response.statusCode = 400;
    context.response.end(error);
}

function setupDynamo (alexa) {
    // Flip this flag if you want to use dynamo
    // If this is not set, we just use a simple, local Mock DB
    var useDynamo = false;
    if (useDynamo) {
        // Configure this JSON file with your correct credentials
        //  Make a copy of config.example.json and substitute in the correct credentials for accessing Dynamo
        AWS.config.loadFromPath('./lib/config.json');
    } else {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        mockery.registerMock('./DynamoAttributesHelper', require("./mockDynamo"));
    }
}

bst.Logless.Domain = "logless-dev.bespoken.tools";
exports.handler = bst.Logless.capture('a3bee070-13ff-4f3e-b7e2-8f0d5dcb510d', handler);


