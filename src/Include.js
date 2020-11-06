/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2019-12-19 18:27:40
 * @LastEditTime: 2020-11-04 12:33:55
 * @FilePath: \hyd-framework\src\Include.js
 */
const path = require('path')

module.exports = (basePath) => {
  return function (relativePath, templatePath) {
    let absolutePath = path.resolve(basePath, relativePath)
    let templateAbsolutePath
    if (templatePath) {
      templateAbsolutePath = path.resolve(templatePath)
    }
    if (path.extname(absolutePath) !== '.js') {
      absolutePath += '.js'
    }
    const filename = path.basename(absolutePath, ".js")
    const splitName = filename.split('.')
    let name = ''
    splitName.forEach(s => {
      const firstLetter = s.charAt(0).toUpperCase()
      name += firstLetter
      name += s.substr(1, s.length - 1)
    })
    return {
      path: absolutePath,
      templatePath: templateAbsolutePath,
      name
    }
  }
}

