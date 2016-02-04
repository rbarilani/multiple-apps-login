var CrossPostMessageHub = (function () {

  /**
   * Recursively merge properties of two objects
   *
   * @private
   *
   * @param {object} obj1
   * @param {object} obj2
   * @returns {object}
   */
  function merge(obj1, obj2, destination) {
    var obj = destination || {};
    for (var p in obj2) {
      try {
        // Property in destination object set; update its value.
        if (obj2[p].constructor == Object) {
          obj[p] = merge(obj1[p], obj2[p], obj);
        } else {
          obj[p] = obj2[p];
        }
      } catch (e) {
        // Property in destination object not set; create it and set its value.
        obj[p] = obj2[p];
      }
    }
    return obj;
  }

  /**
   * Installs the necessary listener for the window message event.
   *
   * @private
   */
  function installListener() {
    window.addEventListener('message', function (e) {
      // console.log('hub receive a message', e);

      if(!checkOrigin.call(this, e.origin)) {
        console.warn('cross-post-message-hub. Origin is not allowed. skip message');
        return;
      }

      try {
        var request = JSON.parse(e.data);
        if (request.event === 'request') {
          onRequest.call(this, request);
        }
      } catch (e) {
        return;
      }
    }.bind(this), true);
  }

  /**
   * Check if the origin is allowed
   *
   * @private
   *
   * @param {string} origin - origin to check
   * @returns bool
   */
  function checkOrigin(origin) {
    if(!this._allowedOrigins.length) {
      return true;
    }
    // FIXME handle regexp
    return this._allowedOrigins.indexOf(origin) > -1;
  }

  /**
   * Called when a request message is received from an allowed origin
   *
   * @param {object} request - a request object
   */
  function onRequest (request) {
    var response = {
      event: 'response',
      request: request
    };

    var definition = this._definitions.find(function (definition) {
      // simple matching
      if (definition.method === request.method
        && definition.uri === request.uri) {
        return definition;
      }
    });

    // NOT FOUND
    if (!definition) {
      response.status = 404;
      response.body = {
        error: 'Definition Not Found'
      };
      window.parent.postMessage(JSON.stringify(response), '*');
      return;
    }

    var promise = new Promise(function (resolve, reject) {
      try{
        definition.cb(request, resolve, reject);
      }catch(e) {
        reject(e);
      }
    });

    promise.then(function (definitionResponse) {
        if (typeof definitionResponse === 'string') {
          response.status = 200;
          response.body = definitionResponse;
        } else {
          response = merge(response, definitionResponse);
        }
        window.parent.postMessage(JSON.stringify(response), '*');
    })
    .catch(function (definitionResponse) {
        if (typeof definitionResponse === 'string') {
          response.status = 500;
          response.body = definitionResponse;
        } else {
          response = merge(response, definitionResponse);
        }
        if(200 <= response.status && response.status < 300) {
          response.status = 500;
        }
        window.parent.postMessage(JSON.stringify(response), '*');
    });
  }


  /**
   * Accepts an options object with one key: allowedOrigins.
   * The value for allowedOrigins is expected to be an an arry of strings or RegExp.
   * The hub is then initialized to accept requests from any of
   * the matching origins.
   * A 'ready' message is sent to the parent window once complete.
   *
   * @example
   * var hub = new CrossStorageHub({
   *  allowedOrigins: ['https://app.com', /:(www\.)?example.com$/ ]
   * });
   *
   * @constructor
   */
  function CrossPostMessageHub(options) {
    var _opt = options || {};
    this._definitions = [];
    this._allowedOrigins = _opt.allowedOrigins || [];
    window.parent.postMessage('cross-post-message:ready', '*');
    installListener.call(this);
  }

  /**
   * Creates a new hub when definition.
   *
   * @param {string} method HTTP method
   * @param {string|RegExp|function(string)} uri HTTP url or function that receives a url
   *   and returns true if the url matches the current definition. uri
   * @param {function} cb - cb(request, resolve, reject) a function that will be executed when a request match the definition
   *
   * @returns {CrossPostMessageHub}
   */
  CrossPostMessageHub.prototype.when = function (method, uri, cb) {
    this._definitions.push({
      method: method,
      uri: uri,
      cb: cb
    });
    return this;
  };

  return CrossPostMessageHub;
})();
