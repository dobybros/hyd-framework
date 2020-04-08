const {ipcRenderer} = require('electron')

class HydElectronRenderer {
  constructor() {
    this._originSender = hyd.sendEvent
    this._originRegisterer = hyd.registerEvent
    this._waitingResultPromises = {}
    this._injectHyd()
    this._registerCommunication()
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
          observer.callback(type, obj, doneCallback)
        } catch (err) {
          if (obj._id && that._waitingResultPromises[obj._id]) {
            that._waitingResultPromises[obj._id].reject(err)
            delete that._waitingResultPromises[obj._id]
          }
        }
      }
    })
    try {
      ipcRenderer.send('hydEvent.register', event)
    } catch (error) {
      console.warn('Exception while register event:', error)
    }
  }

  _registerCommunication() {
    ipcRenderer.on('hydEvent.initHydRoot', (e, message) => {
      const hydFeature = document.createElement('hyd-feature')
      hydFeature.setAttribute('name', message)
      document.body.appendChild(hydFeature)
      setTimeout(() => {
        hyd.initFeatures()
      }, 100);
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
    ipcRenderer.send('hydEvent.hydReady')
  }
}

window.addEventListener('load', function () {
  new HydElectronRenderer()
})

