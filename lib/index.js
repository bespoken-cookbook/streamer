'use strict';

// We use mockery so that we can bypass Dynamo by default
var mockery = require('mockery');
var AWS = require('aws-sdk');

// Use dotenv to configure environment variables
//  Loads variables from local .env file at project root
//  See .env.example for how it works
require('dotenv').config();

setupDynamo();

var Alexa = require('alexa-sdk');
var constants = require('./constants');
var stateHandlers = require('./stateHandlers');
var audioEventHandlers = require('./audioEventHandlers');
var AudioManager = require('./audioManager');
var qs = require('querystring');
var bst = require('bespoken-tools');

// Initial entry point, and checks the signature if necessary
var handler = function(event, context) {
    var appID = null;
    var rssURL = 'http://bespoken.libsyn.com/rss';

    if (process.env.RSS_URL) {
        rssURL = process.env.RSS_URL;
    }

    if (process.env.APP_ID) {
        appID = process.env.APP_ID;
    }
    processEvent(event, context, appID, rssURL);
};

function processEvent (event, context, appID, rssURL) {
    var alexa = Alexa.handler(event, context);
    if (appID !== null) {
        alexa.appId = appID;
    }
    console.log("APP_ID: " + alexa.appId + " APP_ID ENV: " + appID);
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

    AudioManager.load('URL', rssURL, 60, function (error, feed) {
        if (error !== undefined && error !== null) {
            context.fail(error);
        } else {
            alexa.execute();
        }
    });

}

function setupDynamo (alexa) {
    // Flip this flag if you want to use dynamo
    // If this is not set, we just use a simple, local Mock DB
    if (process.env.USE_DYNAMO && process.env.USE_DYNAMO === "true") {
        AWS.config.update({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            },
            region: process.env.AWS_DEFAULT_REGION
        });
        console.log("!Using Dynamo!");

    } else {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        mockery.registerMock('./DynamoAttributesHelper', require("./mockDynamo"));
    }
}

exports.handler = bst.Logless.capture('de1b1580-528d-4f8d-960a-a54ecbcc1ab4', handler);


