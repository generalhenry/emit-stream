var test = require('tap').test;

var emitStream = require('../');
var EventEmitter = require('events').EventEmitter;
var net = require('net');

test('emit', function (t) {
    t.plan(1);
    
    var server = (function () {
        var ev = createEmitter();
        var s = emitStream(ev);
        
        var server = net.createServer(function (stream) {
            s.pipe(stream);
        });
        server.on('close', function () { ev.stop() });
        return server;
    })();
    server.listen(5555);
    
    var collected = [];
    
    server.on('listening', function () {
        var stream = net.connect(5555);
        var ev = emitStream(stream);
        
        ev.on('ping', function (t) {
            collected.push('ping');
        });
        
        ev.on('x', function (x) {
            collected.push(x);
        });
        
        setTimeout(function () {
            t.same(collected, [
                0, 1, 2, 3, 'ping',
                4, 5, 6, 7, 'ping',
                8, 9, 10, 11, 'ping',
            ]);
            stream.end();
        }, 310);
    });
    
    t.on('end', function () {
        server.close();
    });
});

function createEmitter () {
    var ev = new EventEmitter;
    var intervals = [];
    ev.stop = function () {
        intervals.forEach(function (iv) { clearInterval(iv) });
    };
    
    setTimeout(function () {
        intervals.push(setInterval(function () {
            ev.emit('ping', Date.now());
        }, 100));
    }, 5);
    
    var x = 0;
    intervals.push(setInterval(function () {
        ev.emit('x', x ++);
    }, 25));
    
    return ev;
}