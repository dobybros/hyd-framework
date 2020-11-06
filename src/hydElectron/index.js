#!/usr/bin/env node

/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2020-11-04 10:43:24
 * @LastEditTime: 2020-11-04 16:15:39
 * @FilePath: \hyd-framework\src\hydElectron\index.js
 */

/* 
[
  'development',
  manifest file path
]
*/
const { endProcess } = require('./utils');
const Server = require('webpack-dev-server');
const webpack = require('webpack')
const merge = require('webpack-merge');
const path = require('path');
const fs = require('fs')
const webpackConfig = require('./config/webpack.config')
const HtmlWebpackPlugin = require("html-webpack-plugin")
const processOptions = require("webpack-dev-server/lib/utils/processOptions")
const createLogger = require('webpack-dev-server/lib/utils/createLogger');


let projectEnv,manifestPath,manifest,projectRoot = process.cwd();
// judge process.argv[2]
const legalMode = [
  "development",
  "production"
]
if (!process.argv[2]) {
  endProcess(1)
}
if (legalMode.includes(process.argv[2])) {
  projectEnv = process.argv[2]
} else {
  manifestPath = process.argv[2]
}

if (process.argv[3]) {
  manifestPath = process.argv[3]
}
// judge if the manifest file exists
if (fs.existsSync(path.resolve(projectRoot, manifestPath))) {
  try {
    manifest = require(path.resolve(projectRoot, manifestPath))
  } catch (error) {
    console.error(error)
    endProcess(2)
  }
} else {
  endProcess(2)
}


const debug = projectEnv === 'development'

const { features, services, webpackConfig: customWebpackConfigs } = manifest;

const plugins = []
const entry = {}

const resolveExtra = (path) => {
  let absolutePath
  if (fs.existsSync(path)) {
    absolutePath = path
  } else if (fs.existsSync(path + '.js')) {
    absolutePath = path + '.js'
  } else {
    throw new Error(path + ' is not found')
  }
  return absolutePath
}

if (features && features.length) {
  for (let featureDefine of features) {
    let template = featureDefine.template
    const { feature } = featureDefine
    if (!template) {
      template = feature.templatePath
    }
    let absolutePath = resolveExtra(feature.path)
    const name = path.basename(absolutePath, '.feature.js')
    const plugin = new HtmlWebpackPlugin({
      template,
      filename: name + '.feature.html',
      chunks: ['hyd', 'hyd-electron', name + '.feature']
    })
    plugins.push(plugin)
    entry[name + '.feature'] = absolutePath
    console.log('chunk: ', name + '.feature')
    console.log(name + '.feature.html')
  }
}
if (services && services.length) {
  for (let serviceDefine of services) {
    const { service } = serviceDefine
    const template = service.templatePath || config.templatePath
    let absolutePath = resolveExtra(service.path)
    const name = path.basename(absolutePath, '.service.js')
    const plugin = new HtmlWebpackPlugin({
      template,
      filename: name + '.service.html',
      chunks: ['hyd-electron', name + '.service',]
    })
    plugins.push(plugin)
    entry[name + '.service'] = absolutePath
  }
}


const devConfig = {
  mode: process,
  entry,
  plugins
}

const mergedConfig = merge(webpackConfig, devConfig, {mode: projectEnv}, customWebpackConfigs || {})
processOptions(mergedConfig, {}, (handledConfig, options) => {
  let compiler
  try {
    compiler = webpack(handledConfig)
    if (!debug) {
      compiler.run(() => {
        
      })
    }
  } catch (err) {
    if (err instanceof webpack.WebpackOptionsValidationError) {
      console.error(err)
      process.exit(1)
    }
    throw err;
  }
  if (!debug) {
    return
  }
  try {
    const server = new Server(compiler, options, createLogger(options));
    server.listen(options.port, options.host, (err) => {
      if (err) {
        throw err;
      }
    });
    console.log('server is listening on', options.host, ':', options.port)
  } catch (err) {
    if (err.name === 'ValidationError') {
      process.exit(1);
    }
    throw err;
  }
});
