var apps_install;
var _ = require('lodash');
var apps = require('./apps.json');
var spawn = require('child_process').spawn;


apps_install = apps.map(function (app) {
    return [spawn('npm', ['install'], {
      cwd: app.cwd,
      stdio: [0,1,2]
    }), spawn('bower', ['install'], {
      cwd: app.cwd,
      stdio: [0,1,2]
    })];
});
