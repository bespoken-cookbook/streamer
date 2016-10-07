const bst = require('bespoken-tools');

const server = new bst.LambdaServer('lib/index.js', 10000, true);
server.start();
