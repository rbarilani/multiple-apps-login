var LoginClient = {};

(function (exports) {
  // constants
  var EVENTS = {
    LOGGED_IN: 'logged_in',
    LOGGED_OUT: 'logged_out',
    CHANGE: 'change',
    CHANGE_LOGGED_OUT: 'change_logged_out',
    CHANGE_LOGGED_IN: 'change_logged_in',
    ERROR: 'error'
  };
  var STATUS = {
    LOGGED_IN: 'logged_in',
    LOGGED_OUT: 'logged_out',
    ERROR: 'error'
  };
  var DEFAULT = {
    AUTH_HOST: 'http://auth-app.com',
    OPTIONS: {
      debug: false
    }
  };

  // state
  var _storage;
  var _status = STATUS.LOGGED_OUT;
  var _currToken;
  var _callbacks = [];
  var _options = clone(DEFAULT.OPTIONS);
  var _initialized = false;

  /**
   * Pool service
   *
   * @requires {CrossStorageClient} storage
   * @type {{_timeout: null, delay: number, started: boolean, start: Function, stop: Function}}
   */
  var pool = {
    _timeout: null,
    delay: 5000,
    started: false,
    start: function (cb) {
      if (this.started) {
        return;
      }
      this.started = true;
      (function inner(_this) {
        if (_this.started === false) {
          return;
        }
        _this._timeout = window.setTimeout(function () {
          _storage.get('TOKEN').then(function (val) {
            cb(val);
            inner(_this);
          }).catch(function (error) {
            cb(null, error);
            _this.stop();
          });
        }, _this.delay);
      })(this);

      return _storage
        .get('TOKEN');
    },
    stop: function () {
      console.log('POLL STOP', '... clear timeout', this._timeout);
      window.clearTimeout(this._timeout);
      this.started = false;
      return this;
    }
  };

  /**
   * Trigger event private function
   * @description call al registered callbacks for an eventName
   *
   * @private
   *
   * @param {string} eventName
   * @param {*} [...args] - arguments passed to the callbacks
   */
  function triggerEvent(eventName /*, ...args */ ) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    if (!_callbacks[eventName]) {
      return;
    }
    _callbacks[eventName].forEach(function (cb) {
      cb.apply(exports, args);
    });
  }

  /**
   * Log helper private function
   *
   * @param {string} method - console log method to invoke
   * @param {*} [...args] - arguments for the function
   */
  function log(method) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    if(_options.debug) {
      console[method].apply(null, args);
    }
  }

  /**
   * Clone helper private function
   *
   * @private
   *
   */
  function clone(object) {
    return JSON.parse(JSON.stringify(object)); // fixme - naif way to clone an object
  }

  /**
   *
   * LoginClient public api
   *
   */

  // -- constants --
  exports.EVENTS = clone(EVENTS);
  exports.STATUS = clone(STATUS);

  /**
   * Initialize the login client
   *
   * @param {string} [authHost] - default: http://auth-app.com
   * @param {object} [options]
   * @returns {Promise}
   */
  exports.init = function (authHost, options) {
    if(_initialized) {
      throw new Error('loginClient already initialized!');
    }
    _initialized = true;
    _options = options || DEFAULT.OPTIONS; // fixme - merge options
    _storage = new CrossStorageClient( (authHost || DEFAULT.AUTH_HOST) + '/cross-storage-hub');

    return _storage
      .onConnect()
      .then(function () {
        return pool.start(function (token, error) {
          log('debug', 'POLLING THE TOKEN...', token);
          if (error) {
            log('error', error);
            pool.stop();
            triggerEvent(EVENTS.ERROR, error);
            return;
          }

          if (token && !_currToken) {
            _currToken = token;
            if (_status === STATUS.LOGGED_IN) {
              return;
            }
            _status = STATUS.LOGGED_IN;
            triggerEvent(EVENTS.LOGGED_IN);
            return;
          }

          if (!_currToken && !token) {
            if (_status === STATUS.LOGGED_OUT) {
              return;
            }
            _status = STATUS.LOGGED_OUT;
            triggerEvent(EVENTS.LOGGED_OUT);
            return;
          }

          if (!token && _currToken) {
            log('debug', 'TOKEN WAS REMOVED!', token);
            _currToken = token;
            triggerEvent(EVENTS.CHANGE_LOGGED_OUT);
          }
        });
      })
      .then(function (token) {
        if (token) {
          _currToken = token;
          _status = STATUS.LOGGED_IN;
          triggerEvent(EVENTS.LOGGED_IN);
        } else {
          _status = STATUS.LOGGED_OUT;
          triggerEvent(EVENTS.LOGGED_OUT);
        }
        return token;
      })
      .catch(function (error) {
        _status = STATUS.ERROR;
        log('error', error);
        triggerEvent(EVENTS.ERROR, error);
        throw error;
      });
  };

  /**
   * Register a function that will be executed
   * when an event is triggered
   *
   * @param {string} eventName
   * @param {Function} cb
   * @returns {loginClient}
   */
  exports.on = function (eventName, cb) {
    _callbacks[eventName] = _callbacks[eventName] || [];
    _callbacks[eventName].push(cb);
    return this;
  };

  // -- getters --

  /**
   * Get the current token if any
   * @returns {string|undefined}
   */
  exports.token = function () {
    return _currToken;
  };

  /**
   * Get the current login status
   * @returns {string}
   */
  exports.status = function () {
    return _status;
  };

  /**
   * @returns {object}
   */
  exports.options = function () {
    return _options;
  };

})(LoginClient);
