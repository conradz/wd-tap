(function() {
    var output = document.getElementById('output');
    output.appendChild(document.createTextNode([
        'TAP version 13',
        '# beep',
        'ok 1 should be equal',
        'ok 2 should be equivalent',
        '# boop',
        'ok 3 should be equal',
        'ok 4 (unnamed assert)',
        '',
        '1..4',
        '# tests 4',
        '# pass  4',
        '',
        '# ok'
    ].join('\r\n')));
})();