var CrossPostMessageClient = (function () {

  var FRAME_STYLES = {
    display:  'none',
    position: 'absolute',
    top:      '-999px',
    left:     '-999px'
  };

  /**
   * UUID v4 generation, taken from: http://stackoverflow.com/questions/
   * 105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
   *
   * @private
   *
   * @returns {string} A UUID v4 string
   */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  /**
   * Creates a new iFrame containing the hub. Applies the necessary styles to
   * hide the element from view, prior to adding it to the document body.
   * Returns the created element.
   *
   * @private
   *
   * @param  {string}            url The url to the hub
   * @param  {string}            [id] The frame id
   * returns {HTMLIFrameElement} The iFrame element itself
   */
  function createFrame (url, id) {
    var frame, key;

    frame = window.document.createElement('iframe');
    frame.id = id;

    // Style the iframe
    for (key in FRAME_STYLES) {
      if (FRAME_STYLES.hasOwnProperty(key)) {
        frame.style[key] = FRAME_STYLES[key];
      }
    }

    window.document.body.appendChild(frame);
    frame.src = url;

    return frame;
  }

  /**
   * Returns the origin of an url, with cross browser support. Accommodates
   * the lack of location.origin in IE, as well as the discrepancies in the
   * inclusion of the port when using the default port for a protocol, e.g.
   * 443 over https. Defaults to the origin of window.location if passed a
   * relative path.
   *
   * @private
   *
   * @param   {string} url The url to a cross post message hub
   * @returns {string} The origin of the url
   */
  function getOrigin(url) {
    var uri, protocol, origin;

    uri = document.createElement('a');
    uri.href = url;

    if (!uri.host) {
      uri = window.location;
    }

    if (!uri.protocol || uri.protocol === ':') {
      protocol = window.location.protocol;
    } else {
      protocol = uri.protocol;
    }

    origin = protocol + '//' + uri.host;
    origin = origin.replace(/:80$|:443$/, '');

    return origin;
  }

  /**
   * Installs the necessary listener for the window message event.
   * When a ready message is received, the client's _connected status is changed to true, and the
   * ready event is fired. Given a response message, the callback
   * corresponding to its request is invoked. If response.status holds an error value
   * the promise associated with the original request is rejected with
   * the error. Otherwise the promise is fulfilled and passed response.
   *
   * @private
   */
  function installListener() {
    window.addEventListener('message', function (e) {

      // console.log('client received a message', e);
      // check the origin: must be sent from the hub domain;
      if(this._origin !== e.origin) {
        return;
      }

      if(e.data === 'cross-post-message:ready') {
        if(this._connected) { return }
        this._connected = true;
        trigger.call(this, 'ready', e);
        return;
      }

      try{
        var response = JSON.parse(e.data);
        if(response.event === 'response') {
          trigger.call(this, 'response', response);
          onResponse.call(this, response);
        }
      }catch(e) {
        console.warn(e);
        return;
      }

    }.bind(this), false);
  }

  /**
   * Call every function in the _callbacks stack
   * for a specific event
   *
   * @param {string} eventName - the event name
   * @returns {CrossPostMessageClient}
   */
  function trigger(eventName) {
    var _args = Array.prototype.slice.call(arguments);
    _args.shift();

    if (!this._callbacks[eventName]) {
      return this;
    }
    this._callbacks[eventName].forEach(function (cb) {
      cb.apply(this, _args);
    }.bind(this));

    return this;
  }

  /**
   * On response handler, it's called when we receive a response from the hub
   *
   * @private
   *
   * @param response
   */
  function onResponse(response) {
    var request = this._requests[response.request.id];

    if(!request) { return; }
    clearTimeout(request.timeout);
    if(200 <= response.status && response.status < 300) {
      request.resolve(response);
    }else{
      request.reject(response);
    }

    delete this._requests[response.request.id];
  }

  /**
   * Constructs a new cross post message client given the url to a hub. By default,
   * an iframe is created within the document body that points to the url. It
   * also accepts an options object, which may include a timeout, and
   * promise. The timeout, in milliseconds, is applied to each request and
   * defaults to 5000ms. If the promise key is supplied the constructor for a Promise, that Promise library
   * will be used instead of the default window.Promise.
   *
   * @param {string} url
   * @constructor
   */
  function CrossPostMessageClient(url, opts) {
    var _opts = opts || {};
    this._Promise = _opts.promise || Promise;
    this._timeout = _opts.timeout || 5000;
    this._id  = generateUUID();
    this._origin = getOrigin(url);
    this._hub = createFrame(url, 'cross-post-message:' + this._id).contentWindow;
    this._connected = false;
    this._callbacks = {};
    this._requests = {};
    installListener.call(this);
  }

  /**
   * Subscribe to events
   *
   * @param {string} eventName - event name (ready|response)
   * @param {Function} cb - the function to be invoked
   * @returns {CrossPostMessageClient}
   */
  CrossPostMessageClient.prototype.on = function (eventName, cb) {
    this._callbacks[eventName] = this._callbacks[eventName] || [];
    this._callbacks[eventName].push(cb);
    return this;
  };

  /**
   * Sends a request to the hub.
   * Stores a requested object in the _requests object for later invocation when response arrive, or
   * deletion on timeout. Returns a promise that is settled in either instance.
   *
   * @returns {Promise} A promise that is settled on hub response or timeout
   */
  CrossPostMessageClient.prototype.request = function (request) {
    var _this = this;

    if(!this._connected) { return this; }

    request.event = 'request';
    request.id = generateUUID();

    this._hub.postMessage(JSON.stringify(request), this._origin);

    return new this._Promise(function (resolve, reject) {
      var timeout = setTimeout(function() {
        delete _this._requests[request.id];
        reject({
          event: 'response',
          status: 500,
          body: 'cross-post-message-client request timeout',
          request: request.id
        });
      }, _this._timeout || 3000);

      _this._requests[request.id] = {
        resolve: resolve,
        reject: reject,
        timeout: timeout
      }
    });
  };

  return CrossPostMessageClient;
})();
