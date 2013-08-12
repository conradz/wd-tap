var wd = require('wd'),
    finished = require('tap-finished');

module.exports = wdTap;

function createParser(callback) {
    var parser = finished(callback),
        received = [];

    parser.update = function(text) {
        if (!text) {
            return;
        }

        var lines = text.split(/\r?\n/g),
            i = 0;

        for (; i < lines.length; i++) {
            if (lines[i] !== received[i]) {
                break;
            }
        }

        if (i < lines.length) {
            var newLines = lines.slice(i);
            received = received.concat(newLines);
            parser.write(newLines.join('\r\n'));
        }
    };

    return parser;
}

function wdTap(url, browser, callback) {
    var parser = createParser(results),
        finished = false;

    function update() {
        if (finished) {
            return;
        }

        browser.elementById('output', function(err, el) {
            if (err) {
                finished = true;
                return callback(err);
            }

            el.text(function(err, text) {
                if (err) {
                    finished = true;
                    return callback(err);
                }

                parser.update(text);

                if (!finished) {
                    setTimeout(update, 500);
                }
            });
        });
    }

    function results(data) {
        finished = true;
        callback(null, data);
    }

    browser.get(url, function(err) {
        if (err) {
            return callback(err);
        }

        update();
    });
}