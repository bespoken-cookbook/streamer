
var LambdaRunner = require('bespoken-tools/lib/client/lambda-runner').LambdaRunner;
var lambdaRunner = new LambdaRunner('./index.js', 10000);
lambdaRunner.start();

