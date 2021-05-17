/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2019-12-19 18:27:40
 * @LastEditTime: 2020-11-16 11:06:54
 * @FilePath: \tc-class-client-electronjsd:\worklist\hyd-framework\src\hydElectron\utils\PathsUtil.js
 */
const path = require('path');
module.exports = {
  handlePathToName: function (abPath, ext, forType) {
    const filename = path.basename(abPath, ext)
    const splitName = filename.split('.')
    let name = ''
    let type;
    splitName.forEach(s => {
      if (s === 'feature' || s === 'service') {
        type = s
        return
      }
      const firstLetter = s.charAt(0).toUpperCase()
      name += firstLetter
      name += s.substr(1, s.length - 1)
    })
    if (forType) {
      return type || ''
    }
    return name
  }
}
