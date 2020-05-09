const {BrowserWindow} = require('electron')
const HydWindow = require("./HydWindow");
const { debug } = require('../../../versionDiffConfig/acu.config.json')
const eventManager = require('../EventManager').getInstance()
const path = require('path')
const hydBaseUrl = "https://sysloginfrompc.wonderchats.com"

let webpackConfig;
if (debug) {
  webpackConfig = require('../../../../config/webpack.config')
}

class ServiceWindow extends HydWindow {
  constructor(serviceDefine) {
    super()
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
          nodeIntegration: true
        },
      }, this._serviceDefine.window))
      this._electronWindow = window
      const name = path.basename(this._serviceDefine.service.path, '.js')
      if (debug) {
        window.openDevTools()
        const {host, port} = webpackConfig.devServer
        const protocol = webpackConfig.devServer.https ? 'https' : 'http'
        // const serviceUrl = (hydBaseUrl  || `${protocol}://${host}:${port}`) + `/${name}.html`
        // await window.loadURL(serviceUrl)
        const serviceUrl = hydBaseUrl + `/${name}.html`
        window.loadURL(serviceUrl)
      } else {
        const serviceUrl = path.join(__dirname, `../../../dist/${name}.html`)
        window.loadFile(serviceUrl)
      }
      if ((typeof done).indexOf('function') !== -1) {
        done()
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
