/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2019-12-23 15:40:39
 * @LastEditTime: 2020-11-06 16:17:32
 * @FilePath: \hyd-framework\src\hydElectron\EventManager.js
 */
const {uuid} = require('./utils/UUID')

let instance

class EventManager {
  constructor() {
    this._registeredEvents = {}
    this._mustCastEvents = [
      'hydElectron.forwardToRender'
    ]
    this._waitingResultPromises = {}
  }

  static getInstance() {
    return instance
  }

  registerEvent(event, listener) {
    if (typeof event === 'array' && event.length > 0) {
      let tempEvent = event.shift()
      if (!this._registeredEvents[tempEvent]) {
        this._registeredEvents[tempEvent] = []
      }
      this._registeredEvents[tempEvent].push(listener)
      this.registerEvent(event, listener)
    } else if (typeof event === 'string') {
      if (!this._registeredEvents[event]) {
        this._registeredEvents[event] = []
      }
      this._registeredEvents[event].push(listener)
    } else {
      return
    }
  }

  unregisterEvent(event, listener) {
    const listeners = this._registeredEvents[event]
    listener.splice(listeners.indexOf(listener))
  }

  resolveWaitingResultPromise(forId, result) {
    const promise = this._waitingResultPromises[forId]
    if (promise) {
      promise.resolve(result)
      delete this._waitingResultPromises[forId]
    } else {
      this.sendEvent('hydElectron.result', {result, forId})
    }
  }

  sendEvent(event, originData, needForward, timeout) {
    const data = originData || {}
    if  (typeof data !== 'object') {
      return
    }

    return new Promise((resolve, reject) => {
      let id = data._id
      if (!id && timeout) {
        id = uuid(12)
        data._id = id
        this._waitingResultPromises[id] = {
          resolve, reject, outToDate: Date.now() + timeout
        }
      }

      const listeners = this._registeredEvents[event]
      if (listeners) {
        listeners.forEach(listener => {
          if ((typeof listener).toLowerCase().indexOf('function') !== -1) {
            setTimeout(() => {
              listener(data, result => {
                this.resolveWaitingResultPromise(id, result)
              }, event)
            }, 0)
          }
        })
      }
      if (needForward) {
        if (this._mustCastEvents.indexOf(event) === -1) {
          this._mustCastEvents.forEach(e => {
            console.log('will forward:', event, data)
            this.sendEvent(e, {sender: 'main', event, data})
          })
        }
      }
      if (!timeout) {
        resolve()
      }
    })
  }
}

instance = new EventManager
module.exports = EventManager
