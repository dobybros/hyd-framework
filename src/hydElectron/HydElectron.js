/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2019-12-19 18:27:40
 * @LastEditTime: 2020-11-25 14:37:24
 * @FilePath: \hyd-framework\src\hydElectron\HydElectron.js
 */

const {app, ipcMain} = require('electron')
const path = require('path')
const FeatureWindow = require('./window/FeatureWindow')
const ServiceWindow = require('./window/ServiceWindow')
const EventManager = require('./EventManager')
const {handlePathToName} = require("./utils/PathsUtil");

let instance = null

class HydElectron {
  constructor(manifest, debug) {
    const { features, services, webpackConfig } = manifest || {}
    this._nativeManifestFeatures = features || []
    this._nativeManifestServices = services || []
    this.webpackConfig = webpackConfig
    
    this._features = {}
    this._services = {}

    this.debug = debug
  }

  static getInstance(manifest, debug, remoteEnable) {
    if (!instance) {
      instance = new HydElectron(manifest, debug)
    }

    if (!this.remoteEnable) {
      this.remoteEnable = remoteEnable
    }
    return instance
  }

  _loadServices() {
    for (let serviceDefine of this._nativeManifestServices) {
      const serviceName = serviceDefine.service.name
      if (this._services[serviceName]) {
        throw new Error("Duplicate service found, name " + serviceName)
      }
      let window = new ServiceWindow(serviceDefine, this.debug, this.webpackConfig, this.remoteEnable)
      if (!serviceDefine.event) {
        window.generate()
      }
      this._services[serviceName] = window
    }
  }

  _loadFeatures() {
    for (let featureDefine of this._nativeManifestFeatures) {
      const featureName = featureDefine.feature.name
      if (this._features[featureName]) {
        throw new Error("Duplicate feature found, name " + featureName)
      }
      let window = new FeatureWindow(featureDefine, this.debug, this.webpackConfig, this.remoteEnable)
      if (featureDefine.main) {
        window.generate()
      }
      this._features[featureName] = window
    }
  }

  setMainWindow(window) {
    Object.keys(this._features).forEach(feature => {
      this._features[feature].setMainWindow(window)
    })
    Object.keys(this._services).forEach(service => {
      this._services[service].setMainWindow(window)
    })
  }

  getWindowProcessIds() {
    let featureIds = []
    Object.keys(this._features).forEach(feature => {
      let featureManager = this._features[feature]
      let id = featureManager.getWindowProcessId()
      if (id !== undefined) {
        featureIds.push(id)
      }
    })
    return featureIds
  }

  generalAllWindows(showAfterCreate) {
    return new Promise((res, rsp) => {
      let promiseList = Object.keys(this._features).map(feature => {
        return this.generateFeatureWindow(this._features[feature], showAfterCreate)
      })

      Promise.all(promiseList).then(result => {
        res()
      })
    })  
  }

  generateFeatureWindow(feature, showAfterCreate = false) {
    return new Promise((res, rsp) => {
      feature.generate(undefined, res, showAfterCreate)
    })
  }

  destroyAllWindows() {
    Object.keys(this._features).forEach(feature => {
      this._features[feature].forceQuit()
    })
  }

  initAllWindows() {
    Object.keys(this._features).forEach(feature => {
      this._features[feature].initWindow()
    })
  }

  shutdownAllWindows() {
    Object.keys(this._features).forEach(feature => {
      this._features[feature].windowClose(true)
    })
  }

  launch() {
    this._registerEvents()
    this._loadServices()
    this._loadFeatures()
  }
  getFeatureWindow(featureName) {
    return this._features[featureName]
  }
  getServiceWindow(serviceName) {
    return this._services[serviceName]
  }
  

  registerIpcEvent(event, callback) {
    ipcMain.on(event, callback)
  }

  _registerEvents() {
    ipcMain.on('hydEvent.hydReady', (event, message) => {
      event.reply('hydEvent.initHydRoot', {
        name: path.basename(handlePathToName(event.sender.getURL(), '.html')),
        type: path.basename(handlePathToName(event.sender.getURL(), '.html', true))
      })
    })
  }
}

module.exports = HydElectron


