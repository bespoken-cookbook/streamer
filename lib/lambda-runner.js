"use strict";
const fs = require("fs");
const http = require("http");
const querystring = require("querystring");

class LambdaRunner {
    constructor(file, port) {
        this.file = file;
        this.port = port;
        this.server = null;
        this.lambda = null;
    }

    start(callback) {
        let self = this;

        this.server = http.createServer();
        this.server.listen(this.port);
        this.server.on("request", function (request, response) {
            let requestBody = "";
            request.on("data", function (chunk) {
                requestBody += chunk.toString();
            });
            request.on("end", function () {
                if (request.method === "GET") {
                    return response.end("ALIVE");
                }
                else {
                    self.invoke(request, requestBody, response);
                }
            });
        });
        this.server.on("listening", function () {
            if (callback !== undefined && callback !== null) {
                callback();
            }
        });
    }
    invoke(request, body, response) {
        let path = this.file;
        if (!path.startsWith("/")) {
            path = [process.cwd(), this.file].join("/");
        }

        this.lambda = require(path);
        let context = new LambdaContext(response);
        let qs = request.url.substr(request.url.lastIndexOf("?") + 1);
        console.log("qs: "+ qs);
        context.queryString = querystring.parse(qs);
        try {
            let bodyJSON = JSON.parse(body);
            this.lambda.handler(bodyJSON, context);
        }
        catch (e) {
            context.fail("Exception: " + e.message);
        }
    }
    stop(onStop) {
        this.server.close(function () {
            if (onStop !== undefined && onStop !== null) {
                onStop();
            }
        });
    }
}
exports.LambdaRunner = LambdaRunner;
class LambdaContext {
    constructor(response) {
        this.response = response;
    }
    fail(body) {
        this.done(false, body);
    }
    succeed(body) {
        this.done(true, body);
    }
    done(success, body) {
        let statusCode = 200;
        let contentType = "application/json";
        let bodyString = null;
        if (success) {
            bodyString = JSON.stringify(body);
        }
        else {
            statusCode = 500;
            contentType = "text/plain";
            bodyString = body.toString();
        }
        this.response.writeHead(statusCode, {
            "Content-Type": contentType
        });
        if (body) {
            this.response.end(new Buffer(bodyString));
        }
        else {
            this.response.end();
        }
    }
}
exports.LambdaContext = LambdaContext;
//# sourceMappingURL=lambda-runner.js.map