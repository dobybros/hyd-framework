const path = require('path')

module.exports = (basePath) => {
  return function (relativePath) {
    let absolutePath = path.resolve(basePath, relativePath)
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
      name
    }
  }
}

