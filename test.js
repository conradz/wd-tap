var async = require('async'),
    path = require('path'),
    connect = require('connect'),
    wd = require('wd'),
    SauceTunnel = require('sauce-tunnel'),
    http = require('http'),
    wdTap = require('./');

var user = process.env.SAUCE_USER,
    key = process.env.SAUCE_KEY;
if (!user || !key) {
    console.log('Set SAUCE_USER and SAUCE_KEY to your SauceLabs credentials');
    process.exit(1);
}

var browser = wd.remote('ondemand.saucelabs.com', 80, user, key),
    server = null,
    serverPort = 8000,
    id = 'test-' + Date.now(),
    tunnel = new SauceTunnel(user, key, id, true, 120),
    success = false;

run();

function run() {
    async.series([
        start,
        test,
        stop
    ], complete);
}

function start(callback) {
    // Tunnel must be started before browser
    async.series([
        startTunnel,
        startServer,
        startBrowser
    ], callback);
}

function stop(callback) {
    async.parallel([
        stopTunnel,
        stopBrowser,
        stopServer
    ], callback);
}

function startServer(callback) {
    var app = connect();
    app.use(connect.static(path.join(__dirname, 'assets')));

    server = http.createServer(app);
    server.listen(serverPort, function() {
        serverPort = server.address().port;
        callback();
    });
}

function stopServer(callback) {
    server.close(callback);
}

function startTunnel(callback) {
    console.log('Opening tunnel to SauceLabs');
    tunnel.start(function(opened) {
        if (!opened) {
            callback(new Error('Could not open tunnel'));
        } else {
            console.log('Tunnel opened');
            callback();
        }
    });
}

function stopTunnel(callback) {
    console.log('Closing tunnel');
    tunnel.stop(function() {
        console.log('Tunnel closed');
        callback();
    });
}

function startBrowser(callback) {
    console.log('Starting browser');
    browser.init({
        browserName: 'chrome',
        'tunnel-identifier': id,
        name: 'Test browser'
    }, function(err) {
        if (err) {
            return callback(err);
        }

        console.log('Started browser');
        callback();
    });
}

function stopBrowser(callback) {
    console.log('Stopping browser');
    browser.quit(function() {
        console.log('Stopped browser');
        callback();
    });
}

function test(callback) {
    wdTap(
        'http://localhost:' + serverPort + '/test.html',
        browser,
        complete);

    function complete(err, results) {
        if (err) {
            console.error(err);
            return callback();
        }

        if (!results.ok) {
            console.error('Tests did not pass');
            return callback();
        }

        success = true;
        callback();
    }
}

function complete(err) {
    if (err) {
        console.error('Error occurred');
        console.error(err);
        process.exit(1);
    }

    if (success) {
        console.log('Success!');
    } else {
        console.log('Tests failed');
        process.exit(1);
    }
}