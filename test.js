var assert = require('assert');
var async = require('async');
var path = require('path');
var st = require('st');
var wd = require('wd');
var sauceConnect = require('sauce-connect-launcher');
var http = require('http');
var wdTap = require('./');

var user = process.env.SAUCE_USER,
    key = process.env.SAUCE_KEY;
if (!user || !key) {
    console.log('Set SAUCE_USER and SAUCE_KEY to your SauceLabs credentials');
    process.exit(1);
}

var browsers = [
    { name: 'Chrome', browserName: 'chrome' },
    { name: 'IE 9', browserName: 'internet explorer', platform: 'Windows 7', version: '9' }
];

var server = null,
    serverPort = 8000,
    tunnelId = 'test-wd-tap-' + Date.now(),
    tunnel;

startServer();

function startServer() {
    var dir = path.join(__dirname, 'assets');
    server = http.createServer(st({ path: dir, cache: false }));
    server.listen(serverPort, listening);
    
    function listening(err) {
        assert.equal(err, null);
        serverPort = server.address().port;
        startTunnel();
    }
}

function startTunnel() {
    console.log('Opening tunnel to SauceLabs');
    var options = {
        tunnelIdentifier: tunnelId,
        username: user,
        accessKey: key
    };

    sauceConnect(options, function(err, t) {
        assert.equal(err, null);
        tunnel = t;
        console.log('Tunnel opened');
        test();
    });
}

function stopTunnel(callback) {
    console.log('Closing tunnel');
    tunnel.close(function() {
        console.log('Tunnel closed');
        callback();
    });
}

function test() {
    async.eachSeries(browsers, runTest, complete);

    function runTest(browser, callback) {
        var driver;
        start();

        function start() {
            console.log('Starting', browser.name);
            browser['tunnel-identifier'] = tunnelId;

            driver = wd.remote('ondemand.saucelabs.com', 80, user, key);
            driver.init(browser, run);
        }

        function run(err) {
            assert.equal(err, null);
            console.log('Testing', browser.name);
            wdTap(
                'http://localhost:' + serverPort + '/test.html',
                driver,
                done);
        }

        function done(err, results) {
            assert.equal(err, null);
            assert.ok(results.ok);
            assert.equal(typeof results.raw, 'string');
            assert.equal(results.raw.length, 150);

            console.log('Finished ' + browser.name);
            driver.quit(callback);
        }
    }

    function complete(err) {
        assert.equal(err, null);
        console.log('Tests completed');
        cleanup();
    }
}

function cleanup() {
    async.series([
        cleanupServer,
        cleanupTunnel
    ], done);

    function done(err) {
        assert.equal(err, null);
        console.log('Finished');
    }
}

function cleanupServer(callback) {
    if (!server) {
        return callback();
    }

    server.close(callback);
}

function cleanupTunnel(callback) {
    if (!tunnel) {
        return callback();
    }

    tunnel.close(callback);
}
