/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2019-12-23 15:40:40
 * @LastEditTime: 2020-11-10 11:46:36
 * @FilePath: \hyd-framework\src\hydElectron\window\ServiceWindow.js
 */
const {BrowserWindow} = require('electron')
const HydWindow = require("./HydWindow");
const eventManager = require('../EventManager').getInstance()
const path = require('path')

class ServiceWindow extends HydWindow {
  constructor(serviceDefine, debug, webpackConfig) {
    super('service', debug, webpackConfig)
    this._serviceDefine = serviceDefine
    this._electronWindow = null
    this._initServiceWindow()
  }

  _initServiceWindow() {
    if (this._serviceDefine.event) {
      this._bindedGenerate = this.generate.bind(this)
      eventManager.registerEvent(this._serviceDefine.event, this._bindedGenerate)
    }
  }

  async generate(data, done) {
    if (!this._electronWindow) {
      const window = new BrowserWindow(Object.assign({}, {
        show: false,
        webPreferences: {
          // devTools: true,
          nodeIntegration: true,
          contextIsolation: false,
        },
      }, this._serviceDefine.window))
      this._electronWindow = window
      const name = path.basename(this._serviceDefine.service.path, '.js')
      this._loadWindow(path.basename(this._featureDefine.feature.path, '.js'))
      if ((typeof done).indexOf('function') !== -1) {
        setTimeout(() => {
          done()
        }, 0);
      }
    } else {
      this._electronWindow.close()
      this._electronWindow = null
      this.generate()
    }
  }
  openDevTools() {
    this._electronWindow.openDevTools()
  }

  release() {
    eventManager.unregisterEvent(this._serviceDefine.event, this._bindedGenerate)
  }
}

module.exports = ServiceWindow
