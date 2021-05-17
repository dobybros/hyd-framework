const {ipcMain} = require('electron')
const eventManager = require('./EventManager.js').getInstance()

let instance

class RenderEventForwarder {
  constructor() {
    this._registeredWebContents = {}
    this._waitingResultContens = {}

    ipcMain.on('hydEvent.register', this.onRendererHydEventRegister.bind(this))
    ipcMain.on('hydEvent.result', this.onRendererHydEventDone.bind(this))
    ipcMain.on('hydEvent.cast', this.onRendererHydEventCast.bind(this))
    eventManager.registerEvent('hydElectron.forwardToRender', message => {
      const {sender, event, data} = message
      this.forwardToRender(sender, event, data)
    })
    eventManager.registerEvent('hydElectron.result', (message) => {
      if (this._waitingResultContens[message.forId]) {
        this.onRendererHydEventDone({sender: 'main'}, message)
      } else {
        console.error('Event promise has resolved!')
      }
    })
  }

  onRendererHydEventRegister(event, message) {
    console.log('Renderer has registered event',message, event)
    if (!this._registeredWebContents[message]) {
      this._registeredWebContents[message] = []
    }
    if (this._registeredWebContents[message].indexOf(event.sender) === -1) {
      this._registeredWebContents[message].push(event.sender)
    }
  }

  onRendererHydEventDone(event, message) {
    const {forId, result} = message
    const waitingContent = this._waitingResultContens[forId]
    if (waitingContent) {
      waitingContent.send('hydEvent.result', message)
    } else {
      eventManager.resolveWaitingResultPromise(forId, result)
    }
  }

  onRendererHydEventCast(ev, message) {
    console.log(ev, message)
    const {event, data, id} = message
    if (id && !this._waitingResultContens[id]) {
      this._waitingResultContens[id] = ev.sender
    }
    const contents = this._registeredWebContents[message.event]
    if (contents) {
      const errorItems = []
      contents.forEach((content, index) => {
        if (content !== ev.sender) {
          try {
            content.send('hydEvent.forward', message)
          } catch (e) {
            console.error(e)
            errorItems.unshift(index)
            // this._registeredWebContents[message.event].splice(this._registeredWebContents[message.event].indexOf(content))
          }
        }
      })
      errorItems.forEach(item => {
        contents.splice(item, 1)
      })
    }
    this.forwardToMain(ev.sender, event, data)
  }

  forwardToRender(sender, event, data, forceContent) {
    if (sender === 'main') {
      let contents = this._registeredWebContents[event]
      if (forceContent !== undefined) {
        if (typeof forceContent === 'object' && forceContent.send) {
          contents = [forceContent]
        }
      }
      if (contents) {
        const errorItems = []
        contents.forEach((content, index) => {
          try {
            content.send('hydEvent.forward', {event, data})
          } catch (e) {
            errorItems.unshift(index)
          }
        })
        errorItems.forEach(item => {
          contents.splice(item, 1)
        })
      }
    }
  }

  forwardToMain(sender, event, data) {
    eventManager.sendEvent(event, data)
  }

  static getInstance() {
    return instance
  }
}

instance = new RenderEventForwarder()
module.exports = instance
