(function () {
  var hub = new CrossPostMessageHub({
    allowedOrigins: ['http://client-app.com']
  });

  hub.when('GET', '/token', function (request, resolve /*, reject */) {
    resolve('123');
  });
})();
