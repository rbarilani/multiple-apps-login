var CrossPostMessageHub = (function () {

  function installListener() {
    window.addEventListener('message', function (e) {
      console.log('hub receive a message', e);
      // FIXME check the origin first

      try{
        var request = JSON.parse(e.data);
        if(request.event === 'request') {
          this.response(request);
        }
      }catch(e) {
        return;
      }
    }.bind(this), true);
  }
  function CrossPostMessageHub() {
    window.parent.postMessage('cross-post-message:ready', '*');
    installListener.call(this);
  }

  CrossPostMessageHub.prototype.response = function (request) {
    var response = {
      event: 'response',
      request: request
    };

    if(request.message === 'who are you?') {
      response.message = 'I am the hub!';
    }

    window.parent.postMessage(JSON.stringify(response), '*');
  };

  return CrossPostMessageHub;
})();
