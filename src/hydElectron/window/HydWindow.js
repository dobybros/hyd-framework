/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2019-12-23 15:40:39
 * @LastEditTime: 2020-11-25 14:45:14
 * @FilePath: \hyd-framework\src\hydElectron\window\HydWindow.js
 */
const { devServer, output } = require('../config/default.config.js')
const RenderEventForwarder = require('../RenderEventForwarder')
const { ipcMain } = require('electron')
const path = require('path')
const { uuid } = require('../utils/UUID.js')

const os = require('os')

const windowManager = require('./WindowManager.js')

class HydWindow {
  constructor(type, debug, webpackConfig) {
    this._electronWindow = null
    this.windowType = type

    this.finallyDevStatus = Object.assign({}, devServer, webpackConfig.devServer || {})
    this.debug = debug
    this._preHandleEvents = {}
    if (!debug) {
      this.fileOutput = Object.assign({}, output, webpackConfig.output || {})
    }
    this._exitPromise = new Promise((resolve, reject) => {
      this.__exitPromiseObj = { resolve, reject }
      this._sendCloseWindow()
    })
    this.windowId = uuid(10)

    windowManager.addWindow(this.windowType, this)
  }

  _loadWindow(name) {
    let window = this._electronWindow
    if (this.debug) {
      window.openDevTools()
      const { host, port } = this.finallyDevStatus
      const protocol = this.finallyDevStatus.https ? 'https' : 'http'
      // const featureUrl = hydBaseUrl + `/${name}.html`
      const url = `${protocol}://${host}:${port}/${name}.html`
      window.loadURL(url)
    } else {
      try {
        const url = path.join(this.fileOutput.path, `${name}.html`)
        window.loadFile(url)
      } catch (error) {
        console.error(error)
      }
    }

    window.once('closed', () => {
      this.destroy()
    })
  }

  _sendCloseWindow() {
    if (this._electronWindow && this._electronWindow.webContents) {
      this._electronWindow.webContents.send('hydEvent.windowWillClose')
    }
  }

  generateWindowFromEvent(data, done, eventName) {
    this._preHandleEvents[eventName] = this._preHandleEvents[eventName] || []
    this._preHandleEvents[eventName].push(data)
    if (!this._electronWindow) {
      this.generate(data, () => {
        (typeof done === 'function') && done()
      })
    } else {
      if (!this.isDestroyed()) {
        if (this.isHide) {
          this.show()
        } else {
          // same event hide window
          this.windowHide()
        }
      } else {
        
      }
    }
  }

  setMainWindow(window) {
    this._mainWindow = window
  }

  getWindowProcessId() {
    if (this._electronWindow) {
      if (process.platform === 'darwin') {
        return this._electronWindow.getTitle()
      }
      let hbuf = this._electronWindow.getNativeWindowHandle()
      if (os.endianness() == "LE") {
        return hbuf.readInt32LE()
      } else {
        return hbuf.readInt32BE()
      }
    } else {
      return undefined
    }
  }

  windowClose(close, reason) {
    if (close) {
      if (this._electronWindow) {
        this.destroy()
      }
      if (this.__exitPromiseObj) {
        this.__exitPromiseObj.resolve()
      }
    } else {
      if (this.__exitPromiseObj) {
        this.__exitPromiseObj.reject(reason)
      }
    }
    this.__exitPromiseObj = null
  }

  windowHide() {
    if (!this.isDestroyed()) {
      this._electronWindow.hide()
    }
  }

  setWindow({ width, height, x, y }) {
    if (!this.isDestroyed()) {
      this._electronWindow.setSize(width, height, true)
    }
  }

  get window() {
    return this._electronWindow
  }

  get exitFuture() {
    return this._exitPromise
  }
  on(event, callback) {
    this._electronWindow.on(event, callback)
  }
  destroy() {
    if (!this.isDestroyed()) {
      try {
        this._electronWindow.destroy()
      } catch (error) {
        console.log(error)
      }
    }
    this._electronWindow = null
  }

  forceQuit() {
    if (!this.isDestroyed()) {
      this._forceQuit = true
      this._electronWindow.close()
    }
  }
  setBounds(options) {
    this._electronWindow.setBounds(options)
  }
  show() {
    this._electronWindow && this._electronWindow.show()
  }
  center() {
    this._electronWindow.center()
  }
  isDestroyed() {
    if (this._electronWindow) {
      return this._electronWindow.isDestroyed()
    } else {
      return true
    }
  }
  openDevTools() {
    this._electronWindow.openDevTools()
  }

  release() {
    this.destroy()
  }
}

module.exports = HydWindow
