var child_process = require('child_process');
var fs = require('fs');
var AWS = require('aws-sdk');
var tmp = require('tmp');

var AudioConverter = {
    bucket: 'xapp-alexa',

    /**
     * Creates temp file for input, and filename for output
     * Runs ffmpeg to convert m4a input data into mp3 output file
     * Once written, reads it in and deletes the file
     * @param inputData
     * @param callback
     */
    convert: function(inputData, callback) {
        // Create the temporary file
        tmp.file({prefix: 'ffmpeg-', postfix: '.m4a' }, function(error, inputPath, fd, cleanupCallback) {
            // Write the file
            fs.writeFile(inputPath, inputData, null, function () {

                // Get a temporary filename for the output file
                tmp.tmpName({postfix: '.mp3'}, function (error, outputPath) {

                    // Run ffmpeg to convert the file to MP3
                    child_process.execFile('ffmpeg',
                        ['-i', inputPath, '-codec:a', 'libmp3lame', '-b:a', '48k', '-ar', '16000', '-af', 'volume=3', outputPath],
                        function(error, stdout, stderr) {
                            // Call this to delete the input file
                            cleanupCallback();

                            fs.readFile(outputPath, {encoding: null}, function (error, data) {
                                // Delete output file once read
                                fs.unlink(outputPath);
                                callback(data);
                            });
                        }
                    );
                });
            });
        });
    },

    upload: function(bucket, key, data, callback) {
        var s3 = new AWS.S3();
        var params = {Bucket: bucket, Key: key, Body: data, ACL: 'public-read'};
        s3.putObject(params, function (err, data) {
            var url = 'https://s3.amazonaws.com/' + bucket + '/' + key;
            callback(url);
        });
    },

    convertAndUpload: function(name, inputData, callback) {
        var self = this;
        this.convert(inputData, function (outputData) {
            self.upload(self.bucket, name, outputData, function (url) {
                callback(url);
            });
        });
    }
};

module.exports = AudioConverter;