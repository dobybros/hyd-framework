/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2019-12-23 15:40:39
 * @LastEditTime: 2020-11-06 17:13:54
 * @FilePath: \hyd-framework\src\hydElectron\window\FeatureWindow.js
 */
const { BrowserWindow, screen } = require('electron')
const HydWindow = require('./HydWindow')
const path = require('path')
const eventManager = require('../EventManager').getInstance()

class FeatureWindow extends HydWindow {
  constructor(featureDefine, debug, webpackConfig) {
    super(debug, webpackConfig)
    this._featureDefine = featureDefine
    this._electronWindow = null
    this._initFeatureWindow()
    this.debug = debug
  }

  _initFeatureWindow() {
    if (this._featureDefine.event) {
      this._bindedGenerate = this.generateWindowFromEvent.bind(this)
      let featureInitEvents = []
      if (this._featureDefine.event) {
        if (typeof this._featureDefine.event === 'string') {
          featureInitEvents.push(this._featureDefine.event)
        } else if (typeof this._featureDefine.event === 'array') {
          featureInitEvents = featureInitEvents.concat(this._featureDefine.event)
        }
      }
      featureInitEvents.forEach(ev => {
        eventManager.registerEvent(ev, this._bindedGenerate)
      });
      this.featureInitEvents = featureInitEvents
      if (this._featureDefine.readyEvent) {
        this._bindedWindowReadyEvent = this._windowReadyCallback.bind(this)
        eventManager.registerEvent(this._featureDefine.readyEvent, this._bindedWindowReadyEvent)
      }
    }
  }

  async generate(data, done) {
    if (!this._electronWindow) {
      let renderWindowConfig = Object.assign({}, {
        webPreferences: {
          devTools: true,
          nodeIntegration: true,
          enableRemoteModule: true,
        },
        show: false,
      }, this._featureDefine.window)
      if (this._featureDefine.position) {
        switch (this._featureDefine.position) {
          case 'top-center':
            const finalY = 0
            let finalX = 0;
            const primaryDisplay = screen.getPrimaryDisplay()
            const { width } = primaryDisplay.size
            const windowWidth = this._featureDefine.window.width
            finalX = (width - windowWidth) / 2
            renderWindowConfig = Object.assign({}, renderWindowConfig, { x: finalX, y: finalY })
            break;
        
          default:
            break;
        }
      }
      const window = new BrowserWindow(renderWindowConfig)
      this._electronWindow = window

      this._loadWindow(path.basename(this._featureDefine.feature.path, '.js'))
      this._electronWindow.once('ready-to-show', () => {
        if (this._preHandleEvents) {
          const sendPreHandleEvents = JSON.parse(JSON.stringify(this._preHandleEvents))
          this._electronWindow.webContents.executeJavaScript("window.launch(" + JSON.stringify(sendPreHandleEvents) + ")")
          this._preHandleEvents = {}
        }
        if ((typeof done).indexOf('function') !== -1) {
          if (this._featureDefine.readyEvent) {
            this.featureCallback = done;
          } else {
            done()
          }
          this._electronWindow.show();
        }
      })
      this._electronWindow.on('close', () => {
        this._electronWindow = null;
      })
    } else {
      try {
        this._electronWindow.close()
      } catch (err) {
        console.log('close window error,', err)
      } finally {
        this._electronWindow = null
        this.generate(data, done)
      }
    }
  }
  _windowReadyCallback() {
    if (this.featureCallback) {
      this.featureCallback()
    }
  }

  release() {
    this.featureInitEvents.forEach(event => {
      eventManager.unregisterEvent(event, this._bindedGenerate)
    });
    if (this._featureDefine.readyEvent && this._bindedWindowReadyEvent) {
      eventManager.unregisterEvent(this._featureDefine.readyEvent, this._bindedWindowReadyEvent)
    }
  }
}

module.exports = FeatureWindow
