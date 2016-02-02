var apps_processes, http_master;
var _ = require('lodash');
var apps = require('./apps.json');
var spawn = require('child_process').spawn;

http_master = spawn('npm', ['run','start:http-master', '--silent'], {
    stdio: [0,1,2]
});

apps_processes = apps.map(function (app) {
    return spawn(
        app.start.bin,
        app.start.args || [],
        _.extend({}, {
            stdio: [0,1,2]
        }, app.start.options)
    );
});
