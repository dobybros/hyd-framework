import Vue from 'vue'
import {ArrayList} from "../utils/ArrayList";
import {HashMap} from "../utils/HashMap";
import {EventManager} from "../events/EventManager";
import SortedMap from "../utils/SortedMap";
import VueRouter from 'vue-router'

console.log("[[[HYD framework based on VUE]]]");
var HYD = (function () {
  // 	var uiViewManager = new UIViewManager();
  var eventManager = new EventManager();
  var featureMap = new HashMap();

  window.addEventListener("load", function (event) {
    if (event.currentTarget == window) {
      eventManager.sendEvent("ready");
    }
  }, false);

  var HYD = {
    //html, pack js and css into independent file for one html
    //feature, pack js and css for each feature
    //file, don't pack anything, only use for development, no clear cache machanism
    deploy: "file",//WebDeployment
    eventManager: eventManager,
    _viewPrototype: Vue,


    nsf: function (namespaceFile) {
      var name = namespaceFile;
      var pos = namespaceFile.lastIndexOf('.');
      if (pos != -1) {
        this.ns(namespaceFile.substring(0, pos));
        name = namespaceFile.substring(pos + 1);
      }
      return name;
    },
    ns: function (namespaceStr) {
      var namespaceList = namespaceStr.split('.'),
        itemTemp = window,
        i,
        len;
      for (i = 0, len = namespaceList.length; i < len; i++) {
        itemTemp = itemTemp[namespaceList[i]] = itemTemp[namespaceList[i]] || {};
      }
      return itemTemp;
    },
    /**
     * 写入CSS代码.
     * @param cssText {String} CSS代码.
     */
    writeCSSText: function (cssText) {
      // 			if(Object.prototype.toString.call(cssText) == "[object Array]"){
      // 				cssText = cssText.join('\r\n');
      // 			}
      if (!this.isString(cssText)) {
        console.warn("cssText has be String, but is " + (typeof cssText));
        return;
      }
      document.writeln('<style>' + cssText + '</style>');
    },
    /**
     * 修改传递方法的调用作用域
     */
    call: function (scope, callback) {
      var cb = function () {
        callback.apply(scope, arguments);
      }
      return cb;
    },

    extend: function (target, obj) {
      if (typeof obj == 'undefined') {
        obj = target;
        target = this;
      }
      if (obj) {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            target[key] = obj[key];
          }
        }
      }
    },

    /**
     * 生成唯一ID.
     */
    generateId: function () {
      // desired length of Id
      var idStrLen = 32;
      // always start with a letter -- base 36 makes for a nice shortcut
      var idStr = (Math.floor((Math.random() * 25)) + 10).toString(36) + "_";
      // add a timestamp in milliseconds (base 36 again) as the base
      idStr += (new Date()).getTime().toString(36) + "_";
      // similar to above, complete the Id using random, alphanumeric characters
      do {
        idStr += (Math.floor((Math.random() * 35))).toString(36);
      } while (idStr.length < idStrLen);

      return (idStr);
    },

    use: function (external, options) {
      this._viewPrototype.use(external, options)
    },

    registerGlobalPerm: function (key, obj) {
      this._viewPrototype.use(function (v) {
        v.mixin({
          beforeCreate() {
            this.public = {}
          },
          created() {
            console.error(this._uid)
            // this.$data[key] = obj
            this.$set(this.public, key, obj)
          },
        })
      })
    },

    stringToFunction: function (str) {
      var arr = str.split(".");

      var fn = (window || this);
      for (var i = 0, len = arr.length; i < len; i++) {
        fn = fn[arr[i]];
      }

      if (typeof fn !== "function") {
        return undefined;
      }

      return fn;
    },
    /**
     var tennysonQuote = lines(function() {/*!
      Theirs not to make reply,
      Theirs not to reason why,
      Theirs but to do and die
     *\/})
     */
    lines: function (f) {
      return f.toString().replace(/^[^\/]+\/\*!?/, '').replace(/\*\/[^\/]+$/, '');
    },
    registerEvent: function (key, types, observer) {
      if (!key)
        throw "key can not be null while register event"
      var theTypes = undefined
      if (hyd.isString(types))
        theTypes = [types]
      else if (hyd.isArray(types))
        theTypes = types
      else
        throw new Error("Illegal types while register Event, " + types)
      if (!this.eventObserverMap) {
        this.eventObserverMap = {}
      }
      if (hyd.isObject(key)) {
        if (!key._registerHydEventKey) {
          const generateId = this.generateId()
          key._registerHydEventKey = generateId
        }
        key = key._registerHydEventKey
      }
      var list = this.eventObserverMap[key]
      if (!list) {
        list = new ArrayList()
        this.eventObserverMap[key] = list
      }
      for (var i = 0; i < theTypes.length; i++) {
        list.add({observer: observer, type: theTypes[i]})
        hyd.eventManager.registerEvent(theTypes[i], observer)
      }

    },
    unregisterEvent: function (key) {
      if (!key)
        throw "key can not be null while unregisterEvent"
      if (hyd.isObject(key)) {
        key = key._registerHydEventKey
      }
      if (this.eventObserverMap) {
        var list = this.eventObserverMap[key]
        if (list) {
          list.iterate(function (item) {
            hyd.eventManager.unregisterEvent(item.type, item.observer)
          })
          delete this.eventObserverMap[key]
        }
      }
    },
    sendEvent: function (type, obj) {
      hyd.eventManager.sendEvent(type, obj);
    },
    sendInternalEvent: function (type, object) {
      const eventDontNeedToBeBoardCast = true
      this.sendEvent(type, object, eventDontNeedToBeBoardCast)
    },
    initFeatures: function () {
      var z, i, elmnt;

      z = document.querySelectorAll('div[hyd="feature"]');
      for (i = 0; i < z.length; i++) {
        elmnt = z[i];
        this.initFeature(elmnt);
      }
    },
    initFeature: function (elmnt, obj) {
      const scope = this
      var featureObj = obj
      var file, loaded, xhttp, id, jsFile;
      /*search for elements with a certain atrribute:*/
      console.info('hyd-feature attributes like "template", "js", "loaded", "id", "fid" are reserved, please avoid to use above attributes for feature paramaters')
      
      jsFile = elmnt.getAttribute("name");
      if (jsFile === 'SideBarParticipantsTh' || jsFile === 'SideBarParticipantsEn'){
        jsFile = 'SideBarParticipants';
      } else if (jsFile === 'SideBarChatEn' || jsFile === 'SideBarChatTh'){
        jsFile ='SideBarChat';
      }else{
        jsFile = elmnt.getAttribute("name");
      }
      
      if (!this.features) {
        this.features = {}
      }
      var featureJson = this.features[jsFile];
      if (!featureJson) {
        var featureJs = elmnt.getAttribute("js")
        if (featureJs) {
          var result = document.querySelectorAll('script[src="' + featureJs + '"]');
          if (result.length === 0) {
            // 如果当前页面没有引入目标feature，就添加一个script标签帮他引进来
            var oHead = document.getElementsByTagName('HEAD').item(0);
            var oScript = document.createElement("script");
            oScript.type = "text/javascript";
            oScript.src = featureJs;
            oScript.onload = function (event) {
              event.currentTarget.setAttribute("loaded", "true");
              console.log("async js loaded " + event.currentTarget.src);
              hyd.initFeature(elmnt, obj)
              // var script = document.querySelector('script[src="' + featureJs + '"]');
              // hyd.eventManager.sendEvent("IMPORT_" + realPath, {type : "script", element : script});
            }.bind(this);
            oScript.onerror = function (event) {
              console.error("Async load featureJs ", featureJs, " event ", event)
            }.bind(this);
            oHead.appendChild(oScript);
          } else {
            console.warn("The featureJs is loading or loaded already. ", featureJs)
          }
        }

        console.warn("initFeature for " + jsFile + " not found");
        return;
      }
      var featureConstructor = featureJson.featureClass;
      var element = elmnt;
      if (!featureConstructor) {
        // featureJson.asyncImport(function (module, errorMsg) {
        //   if(module) {
        //     this.initFeature(element);
        //   } else {
        //     console.error("Async import " + jsFile + " failed, " + errorMsg);
        //   }
        // }.bind(this));
        featureJson.asyncImport().then(data => {
          this.initFeature(element, featureObj);
        }).catch(reason => {
          console.error("Async import " + jsFile + " failed, " + reason);
        });
        return;
        // console.warn("initFeature for " + jsFile + " constructor not found");
        // return;
      }

      loaded = elmnt.getAttribute("loaded");
      if (loaded == "true") {
        return;
      }
      id = elmnt.getAttribute("id");
      var allAttribute = elmnt.attributes;
      var params = {}
      for (let i = 0; i < allAttribute.length; i++) {
        let attribute = allAttribute[i];
        var key = attribute.nodeName
        params[key] = elmnt.getAttribute(key);
      }
      elmnt.featureParams = params;

      if ((jsFile || file) && loaded !== "true") {

        if (id === undefined || id === null) {
          id = hyd.generateId();
          elmnt.setAttribute("id", id);
        }
        var createFeature = function (feature, target, featureParams) {
          var sendEvent = function (type, obj) {
            hyd.eventManager.sendEvent(type, obj);
          }
          var register = function (type, obj) {
            if (!feature._messageCallbacks) {
              feature._messageCallbacks = new HashMap();
            }

            if (!hyd.isObject(obj)) {
              console.warn("message receiver(" + type + ") need to be a json object. but is " + typeof obj + " obj " + obj);
              return;
            }
            if (!hyd.isFunction(obj.callback)) {
              console.warn("message receiver(" + type + ") need to implement callback function. ");
              return;
            }

            hyd.eventManager.registerEvent(type, obj);
            feature._messageCallbacks.put(obj.key, type);
          }
          var unregister = function (type, obj) {
            hyd.eventManager.unregisterEvent(type, obj);
            if (feature._messageCallbacks) {
              feature._messageCallbacks.remove(obj.key);
            }
          }
          var unregisterAll = function () {
            if (feature._messageCallbacks) {
              var keys = feature._messageCallbacks.keys();
              for (var i = 0; i < keys.length; i++) {
                hyd.eventManager.unregisterEvent(keys[i], feature._messageCallbacks.get(keys[i]));
              }

            }
          }

          if (hyd.isObject(feature)) {
            feature.id = target;

            if (hyd.isFunction(feature.onCreated)) {
              feature.sendEvent = sendEvent; //sendMessage
              feature.registerEvent = register; //receiveMessage
              feature.unregisterEvent = unregister; //unreceiveMessage
              feature.unregisterAllEvents = unregisterAll;

              if (feature.view === undefined) {
                var theData = undefined, theTemplate = undefined, theComponents = undefined, router = undefined;
                if (hyd.isFunction(feature.viewData)) {
                  theData = feature.viewData();
                } else if (hyd.isObject(feature.data)) {
                  theData = feature.data;
                }
                if (hyd.isFunction(feature.viewTemplate)) {
                  theTemplate = feature.viewTemplate();
                } else if (hyd.isObject(feature.template)) {
                  theTemplate = feature.template;
                }
                if (hyd.isFunction(feature.viewComponents)) {
                  theComponents = feature.viewComponents();
                } else if (hyd.isObject(feature.components)) {
                  theComponents = feature.components;
                }
                if (hyd.isFunction(feature.viewRouter)) {
                  router = feature.viewRouter();
                } else if (hyd.isObject(feature.router)) {
                  router = feature.router;
                }
              }
              featureMap.put(feature.id, feature);
              feature.onCreated(featureParams, featureObj);
              console.log(feature.constructor.name + " onCreated");
              if (feature.view === undefined) {
                let options = {
                  data: theData,
                  template: theTemplate,
                  components: theComponents
                }
                if (router) {
                  options.router = new VueRouter(router)
                }
                feature.view = new scope._viewPrototype(options);
                // 								var view = new feature.view();
                // 								feature.view.feature = feature;
              }
              if (feature.view) {
                feature.view.$mount("#" + target);
                console.log(feature.constructor.name + "'s view mounted on tag id " + target);
                if (hyd.isFunction(feature.onViewMounted)) {
                  feature.onViewMounted(feature.view, featureParams, featureObj);
                }
              }
            }

          }
        }
        var container = document.createElement("div");
        container.id = elmnt.getAttribute("id");
        elmnt.setAttribute("fid", container.id);
        // elmnt.setAttribute("id", 'hydFeature');
        elmnt.removeAttribute("id");
        elmnt.appendChild(container);
        elmnt.setAttribute("loaded", "true");
        // 							element.parentNode.replaceChild(container, element);


        // var startPos = jsFile.lastIndexOf("/") + 1;
        // if (startPos === -1)
        //   startPos = 0;
        // var thePath = jsFile.substring(startPos, jsFile.lastIndexOf(".js"));
        // var array = thePath.split(".");
        // var featureClass = array[array.length - 1];
        // var constructor = hyd.stringToFunction(featureClass)
        createFeature(new featureConstructor(), container.id, elmnt.featureParams);
      }
    },
    destroyFeature: function (element, noRemoval) {
      var featureId = element.getAttribute("fid");
      if (hyd.isString(featureId)) {
        var feature = featureMap.get(featureId);
        if (hyd.isObject(feature)) {
          feature.onDestroyed();
          if (feature.view && this.isFunction(feature.view.$destroy)) {
            feature.view.$destroy();
          }
          console.log(feature.name + " onDestroyed");
          featureMap.remove(featureId)
          if (element.parentElement && !noRemoval)
            element.parentElement.removeChild(element)
        }
      }
    },
    reloadFeature: function (element, fob) {
      var featureId = element.getAttribute("fid");
      if (hyd.isString(featureId)) {
        var feature = featureMap.get(featureId);
        if (hyd.isObject(feature)) {
          feature.onDestroyed();
          console.log(feature.name + " onDestroyed");
          featureMap.remove(featureId);
        }
        element.removeAttribute('fid');
        element.removeAttribute('loaded');
        element.childNodes.forEach(function (item, index) {
          element.removeChild(item);
        })
        hyd.initFeature(element, fob);
      }
    },
    /**
     Support both
     hyd.ns("test");
     test.AFeature = hyd.featureV((function(){
      var staticVar = "hello";
      function x() {

      }

      x.prototype.onAppend = function(html, inDom) {

      }

      x.prototype.onRemove = function(html) {

      }

      x.prototype.toInnerHtml = function() {

      }

      return x;
    })());

     and

     hyd.ns("test");
     test.AFeatureEx = hyd.featureV({
      onCreated() {

      },
      onDestroyed() {

      },
      data : "hello"
    });
     */
    component: function (name, component) {
      this._viewPrototype.component(name, component);
    },
    asyncFeature: function (name, asyncImport) {
      if (name == undefined || asyncImport == undefined)
        return;
      if (!this.features) {
        this.features = {};
      }
      // asyncImport().then(data => {
      //   callback(data);
      // }).catch(reason => {
      //   callback(undefined, reason);
      // });
      if (!this.features[name]) {
        this.features[name] = {
          asyncImport: asyncImport
        };
      }
    },
    feature: function (name, featureConstructor) {
      if (name == undefined || featureConstructor == undefined)
        return;
      if (!this.features) {
        this.features = {};
      }
      this.features[name] = {
        featureClass: featureConstructor,
      };
    },

    asyncCalls: function (actionJsons, callback) {
      let calls = undefined;
      if (this.isObject(actionJsons)) {
        calls = [actionJsons];
      } else if (this.isArray(actionJsons)) {
        calls = actionJsons;
      } else {
        console.error("[asyncCalls] actionJsons is expected to be Json object or Array of Json objects, actual is " + actions);
        return;
      }
      let successObjs = [], failedObjs = [];
      var confirmArray = [];
      for (var i = 0; i < calls.length; i++) {
        confirmArray.push(i);
      }
      var successCallback = function (callbackData) {
        this.actionJson.callbackData = callbackData;
        this.successObjs.push(this.actionJson);
        this.confirmCallback(this.actionIndex);
      }
      var failedCallback = function (callbackData) {
        this.actionJson.callbackData = callbackData;
        this.failedObjs.push(this.actionJson);
        this.confirmCallback(this.actionIndex);
      }
      var confirmCallback = function (index) {
        for (var i = 0; i < this.confirmArray.length; i++) {
          if (this.confirmArray[i] == index) {
            this.confirmArray.splice(i, 1);
          }
        }
        if (this.confirmArray.length == 0) {
          this.resultCallback(this.successObjs, this.failedObjs);
        }
      }
      var length = calls.length;
      if (length === 0) {
        callback(successObjs, failedObjs);
      } else {
        for (var i = 0; i < length; i++) {
          if (this.isFunction(calls[i].run)) {
            var obj = undefined;
            try {
              var Constructor = function () {
              };
              this.extend(Constructor.prototype, calls[i]);
              Constructor.prototype.success = successCallback;
              Constructor.prototype.failed = failedCallback;
              Constructor.prototype.confirmCallback = confirmCallback;
              Constructor.prototype.resultCallback = callback;
              obj = new Constructor();
              obj.actionIndex = i;
              obj.actionJson = calls[i]
              obj.failedObjs = failedObjs;
              obj.successObjs = successObjs;
              obj.confirmArray = confirmArray;
              obj.run();
            } catch (e) {
              console.error("[asyncCalls] execute action " + calls[i] + " at " + i + " failed, " + e);
              if (obj) {
                obj.failed(e)
                // failedObjs.push(calls[i])
              }
            }
          } else {
            console.warn("[asyncCalls] action json don't contain run method, " + calls[i] + " at " + i);
          }
        }
      }
    },


    isObject: function (obj) {
      return Object.prototype.toString.call(obj) === '[object Object]';
    },

    setRemoteFunction: function (type, callback) {
      if (typeof type !== 'string') {
        return
      }

      if (!this._remoteFunctionObserverMap) {
        this._remoteFunctionObserverMap = {}
      }

      if (this._remoteFunctionObserverMap[type]) {
        hyd.unregisterEvent(this._remoteFunctionObserverMap[type].id)
        delete this._remoteFunctionObserverMap[type]
      }

      if (typeof callback === 'function') {
        this._remoteFunctionObserverMap[type] = {
          requestEvent: type + 'Request',
          responseEvent: type + 'Response',
          id: this.generateId(),
          callback,
        }


        // register requestEvent
        hyd.registerEvent(this._remoteFunctionObserverMap[type].id, this._remoteFunctionObserverMap[type].requestEvent, {
          scope: this,
          callback(event, {remoteId, data}) {
            // 防止remote的方法名里也有Request
            let remoteFunction = event.split('Request')
            remoteFunction.pop()
            remoteFunction = remoteFunction.join('Request')

            if (remoteFunction && this._remoteFunctionObserverMap[remoteFunction]) {
              let remoteObj = this._remoteFunctionObserverMap[remoteFunction]
              remoteObj.callback(data, result => {
                hyd.sendEvent(this._remoteFunctionObserverMap[type].responseEvent, {remoteId, result})
              })
            }
          }
        })
      }
    },

    removeRemoteFunction: function (type) {
      if (this._remoteFunctionObserverMap && this._remoteFunctionObserverMap[type]) {
        hyd.unregisterEvent(this._remoteFunctionObserverMap[type].id)
        delete this._remoteFunctionObserverMap[type]
      }
    },

    callRemoteFunction: function (type, obj, timeout = 10 * 6000) {
      if (typeof type === 'string') {
        return new Promise((resolve, reject) => {

          if (!this._remoteFunctionPromiseMap) {
            this._remoteFunctionPromiseMap = {}
          }
          if (!this._remoteFunctionPromiseMap[type]) {
            this._remoteFunctionPromiseMap[type] = {}
          }

          let remoteId = this.generateId()
          // 可能存在泄露
          let targetObj = {
            callback: function () {
              try {
                let remoteFunctionObj = this.scope._remoteFunctionPromiseMap[this.type][this.remoteId]
                if (remoteFunctionObj) {
                  remoteFunctionObj.promise.reject(-1)
                  delete this.scope._remoteFunctionPromiseMap[this.type][this.remoteId]
                  if (Object.keys(this.scope._remoteFunctionPromiseMap[this.type]).length === 0) {
                    hyd.unregisterEvent(this.type + 'Response')
                  }
                }
              } catch (error) {

              }
            },
            type,
            remoteId,
            lastTimeout: Date.now() + timeout,
            promise: {resolve, reject},
            scope: this,
          }
          targetObj.timeout = setTimeout(targetObj.callback.bind(targetObj), timeout)
          this._remoteFunctionPromiseMap[type][remoteId] = targetObj
          // register responseEvent
          if (Object.keys(this._remoteFunctionPromiseMap[type]).length === 1) {
            hyd.registerEvent(type + 'Response', type + 'Response', {
              scope: this,
              callback(event, {remoteId, result}) {
                const remoteFunction = event.split('Response')[0]
                if (this._remoteFunctionPromiseMap[remoteFunction]) {
                  let remoteObj = this._remoteFunctionPromiseMap[remoteFunction][remoteId]
                  if (remoteObj.promise) {
                    if (remoteObj.lastTimeout && remoteObj.lastTimeout >= Date.now()) {
                      clearTimeout(remoteObj.timeout)
                      remoteObj.promise.resolve(result)
                      remoteObj.promise = null
                      remoteObj.lastTimeout = undefined
                      remoteObj = null
                      delete this._remoteFunctionPromiseMap[remoteFunction][remoteId]
                    }
                  }
                }
                if (Object.keys(this._remoteFunctionPromiseMap[remoteFunction]).length === 0) {
                  hyd.unregisterEvent(event)
                }
              }
            })
          }

          hyd.sendEvent(type + 'Request', {
            remoteId,
            data: obj
          })
        })
      }
    },

    isInt: function (x) {
      return x % 1 === 0;
    },

    isFunction: function (functionToCheck) {
      var getType = {};
      return functionToCheck && (getType.toString.call(functionToCheck) == '[object Function]' || getType.toString.call(functionToCheck) == '[object AsyncFunction]');
    },

    isArray: function (obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    },

    isString: function (obj) {
      return Object.prototype.toString.call(obj) === '[object String]';
    },
    replaceString: function (value, params) {
      if (!hyd.isString(value)) {
        return "";
      }

      var replacedStr = value
      if (params == undefined || params == null)
        return replacedStr
      if (!hyd.isArray(params)) {
        params = [params]
      }
      params.forEach(function (value, index) {
        var reg = "\{" + index + "\}"
        replacedStr = replacedStr.replace(reg, value);
      })
      return replacedStr
    },
    isMobile() {
      var sUserAgent = navigator.userAgent.toLowerCase();
      var bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
      var bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
      var bIsMidp = sUserAgent.match(/midp/i) == "midp";
      var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
      var bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
      var bIsAndroid = sUserAgent.match(/android/i) == "android";
      var bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
      var bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
      if (
        bIsIpad ||
        bIsIphoneOs ||
        bIsMidp ||
        bIsUc7 ||
        bIsUc ||
        bIsAndroid ||
        bIsCE ||
        bIsWM
      ) {
        return true
      } else {
        return false
      }
    }
  };

  // HYD._viewPrototype.config.ignoredElements = [
  //   "feature-view"
  // ]

  return HYD;
})();
var hyd = HYD;
hyd.EventManager = EventManager
hyd.ArrayList = ArrayList
hyd.SortedMap = SortedMap
hyd.HashMap = HashMap
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}
hyd.use(VueRouter)
export {
  hyd
}

