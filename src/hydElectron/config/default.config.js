/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2020-11-04 15:38:37
 * @LastEditTime: 2020-11-04 15:51:16
 * @FilePath: \hyd-framework\src\hydElectron\config\default.config.js
 */
const path = require('path');
module.exports = {
  devServer: {
    host: 'localhost',
    port: 6359
  },
  output: {
    path: path.resolve(__dirname, './hydElectronDist'),
    filename: "[name]/app.bundle.[hash:8].js"
  }
}