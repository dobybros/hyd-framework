const {features, services} = require('../config/manifest.config')
const {app, ipcMain} = require('electron')
const path = require('path')
const FeatureWindow = require('./libs/window/FeatureWindow')
const ServiceWindow = require('./libs/window/ServiceWindow')
const EventManager = require('./libs/EventManager')
const RenderEventForwarder = require('./libs/RenderEventForwarder')
const {handlePathToName} = require("./utils/PathsUtil");

let instance = null

class HydElectron {
  constructor() {
    this._features = {}
    this._services = {}
  }

  static getInstance() {
    if (!instance) {
      instance = new HydElectron()
    }
    return instance
  }

  _loadServices() {
    for (let serviceDefine of services) {
      const serviceName = serviceDefine.service.name
      if (this._services[serviceName]) {
        throw new Error("Duplicate service found, name " + serviceName)
      }
      let window = new ServiceWindow(serviceDefine)
      if (!serviceDefine.event) {
        window.generate()
      }
      this._services[serviceName] = window
    }
  }

  _loadFeatures() {
    for (let featureDefine of features) {
      const featureName = featureDefine.feature.name
      if (this._features[featureName]) {
        throw new Error("Duplicate feature found, name " + featureName)
      }
      let window = new FeatureWindow(featureDefine)
      if (featureDefine.main) {
        window.generate()
      }
      this._features[featureName] = window
    }
  }

  launch() {
    this._registerEvents()
    app.once('ready', () => {
      this._loadFeatures()
      this._loadServices()
    })
  }

  _registerEvents() {
    ipcMain.on('hydEvent.hydReady', (event, message) => {
      event.reply('hydEvent.initHydRoot', path.basename(handlePathToName(event.sender.history[0], '.html')))
    })
  }
}

module.exports = HydElectron


