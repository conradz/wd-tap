# wd-tap

Run TAP tests in the browser with WebDriver.

This is a simple utility to run [TAP](http://testanything.org/) tests in a
browser that is automated using
[WebDriver](http://docs.seleniumhq.org/projects/webdriver/), driven using
[Node.js](http://nodejs.org/).

## Getting Started

You must first have a test page that has a `<pre>` element with an ID of
`output` that will contain the TAP test output. You will also need a web
browser that is automated using WebDriver; you can run one yourself locally or
you could use a service like [Sauce Labs](http://saucelabs.com/) that will run
them for you. For attaching to a WebDriver-automated browser, use
[wd](https://github.com/admc/wd) that allows Node to interface to WebDriver.

The test results are parsed using
[tap-parser](https://github.com/substack/tap-parser).

## Example

This example assumes that you have a WebDriver server running locally, see the
[wd docs](https://github.com/admc/wd) for how to connect to a browser. It also
assumes that you have an HTTP server accessible from the browser serving the
test page at `http://localhost:8000/test.html`.

```js
var wd = require('wd'),
    wdTap = require('wd-tap');

var browser = wd.remote(),
    url = 'http://localhost:8000/test.html';

browser.init(function(err) {
    if (err) { return; }

    wdTap(url, browser, function(err, results) {
        // results is the parsed TAP results
        if (!results.ok) {
            console.log('Tests failed');
        }

        browser.quit();
    });
});
```