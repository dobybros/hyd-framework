/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2020-11-03 18:34:37
 * @LastEditTime: 2020-11-09 14:49:27
 * @FilePath: \hyd-framework\src\hydElectron\config\webpack.config.js
 */
const VueLoaderPlugin = require("vue-loader/lib/plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const webpack = require('webpack');
const path = require('path')

const defaultConfig = require('./default.config.js')

module.exports = {
  mode: "production",
  entry: {
    'hyd': path.resolve(__dirname, '../../../dist/hyd.js'),
    'hyd-electron': path.resolve(__dirname, '../HydElectronRenderer.js')
  },
  output: {
    path: defaultConfig.output.path,
    filename: defaultConfig.output.filename
  },
  devServer: {
    host: defaultConfig.devServer.host,
    port: defaultConfig.devServer.port,
    hot: true
  },
  devtool: "source-map",
  module: {
    rules: [{
      test: /\.vue$/,
      loader: 'vue-loader'
    }, {
      test: /\.(feature|service).js$/,
      loader: 'hyd-loader'
    }, {
      test: /.css$/,
      loader: [
        'vue-style-loader',
        'css-loader'
      ]
    }, {
      test: /\.(png|jpeg|jpg|gif|svg)$/,
      loader: 'url-loader'
    }, {
      test: /.less$/,
      loader: [
        'vue-style-loader',
        'css-loader',
        'less-loader'
      ]
    }, {
      test: /\.(proto|mp4)$/,
      use: {
        loader: 'file-loader'
      }
    }]
  },
  resolve: {
    extensions: ['.js', '.vue', '.json', '.css', 'less']
  },
  target: 'electron-renderer',
  plugins: [
    new VueLoaderPlugin(),
    new CleanWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ],
}