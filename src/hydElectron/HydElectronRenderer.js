const {ipcRenderer} = require('electron')

class HydElectronRenderer {
  constructor() {
    this._originSender = hyd.sendEvent.bind(hyd)
    this._originRegisterer = hyd.registerEvent.bind(hyd)
    this._waitingResultPromises = {}
    // 预处理事件缓存
    this._preHandleEvents = {}
    this._injectHyd()
    this._registerCommunication()

    window.launch = this.launch.bind(this)

  }

  static random(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random() * 16;
          uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  }

  _injectHyd() {
    hyd.sendEvent = this._sendEvent.bind(this)
    hyd.registerEvent = this._registerEvent.bind(this)
    hyd.ipcSendSync = this._sendSync.bind(this)
  }

  _sendEvent(event, data, timeout = 0) {
    return new Promise((resolve, reject) => {
      let id
      if (timeout) {
        id = HydElectronRenderer.random(12)
        data._id = id
        this._waitingResultPromises[id] = {
          resolve, reject, outOfDate: Date.now() + timeout
        }
      }
      this._originSender(event, data)

      try {
        let copyData = data;
        if (typeof data === 'object') {
          copyData = JSON.parse(JSON.stringify(data))
        }
        ipcRenderer.send('hydEvent.cast', {
          event, id,
          data: copyData
        })
      } catch (error) {
        console.warn('Exception while forward cast:', error)
      }

      if (!timeout) {
        resolve()
      }
    })
  }
  _sendSync(event, data) {
    const result = ipcRenderer.sendSync(event, data)
    return result
  }

  _registerEvent(key, event, observer) {
    const that = this
    this._originRegisterer(key, event, {
      callback: function (type, obj) {
        const doneCallback = (result) => {
          if (obj._id) {
            const id = obj._id
            if (that._waitingResultPromises[id]) {
              that._waitingResultPromises[id].resolve(result)
              delete that._waitingResultPromises[id]
            } else {
              ipcRenderer.send('hydEvent.result', {
                forId: id,
                result
              })
            }
          }
        }
        try {
          if (typeof observer === 'function')  {
            observer(type, obj, doneCallback)
          } else if (observer.callback && typeof observer.callback === 'function') {
            if (observer.scope) {
              observer.callback.call(observer.scope, type, obj, doneCallback)
            } else {
              observer.callback(type, obj, doneCallback)
            }
          }
        } catch (err) {
          if (obj._id && that._waitingResultPromises[obj._id]) {
            that._waitingResultPromises[obj._id].reject(err)
            delete that._waitingResultPromises[obj._id]
          }
        }
      }
    })
    // 判断是否有已经存在的Events，如果有的话就直接触发
    if (this._preHandleEvents[event] && this._preHandleEvents[event].length > 0) {
      const waitEvents = this._preHandleEvents[event]
      waitEvents.forEach(data => {
        this._originSender(event, data)
      });
      
      delete this._preHandleEvents[event];
    }
    try {
      ipcRenderer.send('hydEvent.register', event)
    } catch (error) {
      console.warn('Exception while register event:', error)
    }
  }

  _registerCommunication() {
    ipcRenderer.on('hydEvent.initHydRoot', (e, { name, type }) => {
      const hydFeature = document.createElement('div')
      hydFeature.setAttribute('hyd', type)
      hydFeature.setAttribute('name', name)
      document.body.appendChild(hydFeature)
      hyd.initFeatures()
    })
    ipcRenderer.on('hydEvent.forward', (e, message) => {
      const {event, data} = message
      console.log('event froward111', event, data)
      this._originSender(event, data)
    })
    ipcRenderer.on('hydEvent.result', (e, message) => {
      const {result, forId} = message
      const id = forId
      if (this._waitingResultPromises[id]) {
        this._waitingResultPromises[id].resolve(result)
        delete this._waitingResultPromises[id]
      }
    })
    console.log(window.preHandleEvents, Date.now())
  }
  
  launch(preHandleEvents) {
    console.log('asd',JSON.stringify(preHandleEvents))
    if (preHandleEvents) {
      this._preHandleEvents = preHandleEvents
    }
    ipcRenderer.send('hydEvent.hydReady')
  }
}

window.addEventListener('load', function () {
  window.yes = true
  console.log(window.preHandleEvents, Date.now())
  new HydElectronRenderer()
})

