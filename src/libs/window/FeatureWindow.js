const {BrowserWindow} = require('electron')
const { debug } = require('../../../versionDiffConfig/acu.config.json')
const HydWindow = require('./HydWindow')
const path = require('path')
let webpackConfig;
if (debug) {
  webpackConfig = require('../../../../config/webpack.config')
}
const eventManager = require('../EventManager').getInstance()
const hydBaseUrl = "https://sysloginfrompc.wonderchats.com"

class FeatureWindow extends HydWindow {
  constructor(featureDefine) {
    super()
    this._featureDefine = featureDefine
    this._electronWindow = null
    this._initFeatureWindow()
  }

  _initFeatureWindow() {
    if (this._featureDefine.event) {
      this._bindedGenerate = this.generate.bind(this)
      eventManager.registerEvent(this._featureDefine.event, this._bindedGenerate)
      eventManager.registerEvent(this._featureDefine.readyEvent, this._windowReadyCallback.bind(this))
    }
  }

  async generate(data, done) {
    if (!this._electronWindow) {
      const window = new BrowserWindow(Object.assign({}, {
        webPreferences: {
          devTools: true,
          nodeIntegration: true
        }
      }, this._featureDefine.window))
      this._electronWindow = window
      const name = path.basename(this._featureDefine.feature.path, '.js')
      if (debug) {
        window.openDevTools()
        const {host, port} = webpackConfig.devServer
        const protocol = webpackConfig.devServer.https ? 'https' : 'http'
        const featureUrl = hydBaseUrl + `/${name}.html`
        window.loadURL(featureUrl)
      } else {
        const featureUrl = path.join(__dirname, `../../../dist/${name}.html`)
        window.loadFile(featureUrl)
      }
      
      if ((typeof done).indexOf('function') !== -1) {
        if (this._featureDefine.readyEvent) {
          this.featureCallback = done;
        } else {
          done()
        }
      }
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
    eventManager.unregisterEvent(this._featureDefine.event, this._bindedGenerate)
  }
}

module.exports = FeatureWindow
