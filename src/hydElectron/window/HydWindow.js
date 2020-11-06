/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2019-12-23 15:40:39
 * @LastEditTime: 2020-11-06 11:29:14
 * @FilePath: \hyd-framework\src\hydElectron\window\HydWindow.js
 */
const { devServer, output } = require('../config/default.config.js')
const RenderEventForwarder = require('../RenderEventForwarder')
const path = require('path')
class HydWindow {
  constructor(debug, webpackConfig) {
    this._electronWindow = null

    this.finallyDevStatus = Object.assign({}, devServer, webpackConfig.devServer || {})
    this.debug = debug
    this._preHandleEvents = {}
    if (!debug) {
      this.fileOutput = Object.assign({}, output, webpackConfig.output || {})
    }
    this._exitPromise = new Promise((resolve, reject) => {

    })
  }

  _loadWindow(name) {
    let window = this._electronWindow
    if (this.debug) {
      window.openDevTools()
      const {host, port} = this.finallyDevStatus
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
  }

  generateWindowFromEvent(data, done, eventName) {
    this._preHandleEvents[eventName] = this._preHandleEvents[eventName] || []
    this._preHandleEvents[eventName].push(data)
    if (!this._electronWindow) {
      this.generate(data, () => {
          (typeof done === 'function') && done()
      })
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
    this._electronWindow && this._electronWindow.destroy()
    this._electronWindow = null
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
}

module.exports = HydWindow
