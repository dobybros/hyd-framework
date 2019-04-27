import {HashMap} from '../utils/HashMap'
import {hyd} from "../hyd/hyd";

//EventManager.js
var EventManager = (function (global) {
  var map = new HashMap();
  var ASYNC = "async";
  var CALLBACK = "callback";
  var CALLBACKKEY = "key";
  var SCOPE = "scope";
  var ONETIME = "onetime";
  /*
   * success(returnObj, observer)
   */
  var RESULT_SUCCESS = "success";
  /*
   * failed(error, observer)
   */
  var RESULT_FAILED = "failed";
  var eventManager;
  function _eventManager() {
    if (!eventManager)
      eventManager = this;
    else
      throw "EventManager can only be created once. "
    this.globalErrorHandler = this;
  }

  _eventManager.prototype.setGlobalErrorHandler = function (handler) {
    if (handler && typeof handler[RESULT_FAILED] === 'function') {
      this.globalErrorHandler = handler;
    }
  }

  _eventManager.prototype.failed = function (message, obj, error) {
    //        alert("EventManager occur error " + message + " obj " + (obj ? typeof obj : ""));
    if (console && typeof console.error === 'function')
      console.error("EventManager occur error " + message + " obj " + (obj ? typeof obj : "") + " stack: " + (error ? error.stack : ""));
  }

  _eventManager.prototype.sendGlobalError = function (message, obj, error) {
    if (this.globalErrorHandler && typeof this.globalErrorHandler.failed === 'function')
      this.globalErrorHandler.failed(message, obj, error);
  }

  _eventManager.prototype.keys = function () {
    if (map)
      return map.keys();
  }

  _eventManager.prototype.registerEvent = function (type, observer) {
    if (this.verifyObserver(observer)) {
      var typeMap = map.get(type);
      if (!typeMap) {
        typeMap = new HashMap();
        map.put(type, typeMap);
      }
      var key = observer[CALLBACKKEY];
      if (!key) {
        key = hyd.generateId();
        observer[CALLBACKKEY] = key;
      }
      typeMap.put(key, observer);
    }
  }

  _eventManager.prototype.unregisterEvent = function (type, key) {
    var typeMap = map.get(type);
    if (typeMap) {
      if (hyd.isObject(key) && key[CALLBACKKEY]) {
        key = key[CALLBACKKEY];
      }
      if (key) {
        typeMap.remove(key);
        if (typeMap.count() === 0) {
          map.remove(type);
        }
      } else {
        map.remove(type);
      }
    }
  }

  _eventManager.prototype.sendEvent = function (type, obj) {
    var typeMap = map.get(type);
    if (typeMap) {
      var toRemoveObservers = undefined;
      typeMap.forEach(function (observer, key) {
        if (typeof observer[CALLBACK] === 'function') {
          try {
            var returnObj;
            if (observer[SCOPE]) {
              returnObj = observer[CALLBACK].call(observer[SCOPE], type, obj);
            } else {
              returnObj = observer[CALLBACK](type, obj);
            }
            if (!observer[ASYNC]) {
              if (obj && typeof obj[RESULT_SUCCESS] === 'function') {
                if (obj[SCOPE]) {
                  obj[RESULT_SUCCESS].call(obj[SCOPE], returnObj, observer);
                } else {
                  obj[RESULT_SUCCESS](returnObj, observer);
                }
              }
            }
          } catch (err) {
            if (console && typeof console.error === 'function')
              console.error("Handle event " + type + " occured error: " + (err.stack === undefined ? err : err.stack));
            if (obj && typeof obj[RESULT_FAILED] === 'function') {
              if (obj[SCOPE]) {
                obj[RESULT_FAILED].call(obj[SCOPE], err, observer);
              } else {
                obj[RESULT_FAILED](err, observer);
              }
            }
          } finally {
            if (observer[ONETIME]) {
              if (!toRemoveObservers) {
                toRemoveObservers = [];
              }
              toRemoveObservers.push(observer);
            }
          }
        }
      });
      if (toRemoveObservers !== undefined) {
        for (var i = 0; i < toRemoveObservers.length; i++) {
          var key = toRemoveObservers[i][CALLBACKKEY];
          if (!key) {
            key = toRemoveObservers[i];
          }
          this.unregisterEvent(type, key);
        }
      }
      if (obj && obj[ONETIME]) {
        this.unregisterEvent(type);
      }
    }
  }

  _eventManager.prototype.verifyObserver = function (observer) {
    if (!observer) {
      this.globalErrorHandler.failed("eventCallback is undefined");
      return false;
    }
    if (typeof observer[CALLBACK] !== 'function') {
      this.globalErrorHandler.failed("eventCallback don't contain eventReceived function", observer);
      return false;
    }
    return true;
  }

  return _eventManager;
})();

export {
  EventManager
}