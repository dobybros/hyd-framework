/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2019-12-19 18:27:40
 * @LastEditTime: 2020-11-16 11:05:03
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

  static getInstance(manifest, debug) {
    if (!instance) {
      instance = new HydElectron(manifest, debug)
    }
    return instance
  }

  _loadServices() {
    for (let serviceDefine of this._nativeManifestServices) {
      const serviceName = serviceDefine.service.name
      if (this._services[serviceName]) {
        throw new Error("Duplicate service found, name " + serviceName)
      }
      let window = new ServiceWindow(serviceDefine, this.debug, this.webpackConfig)
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
      let window = new FeatureWindow(featureDefine, this.debug, this.webpackConfig)
      if (featureDefine.main) {
        window.generate()
      }
      this._features[featureName] = window
    }
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
        name: path.basename(handlePathToName(event.sender.history[0], '.html')),
        type: path.basename(handlePathToName(event.sender.history[0], '.html', true))
      })
    })
  }
}

module.exports = HydElectron


