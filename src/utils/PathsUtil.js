const path = require('path');
module.exports = {
  handlePathToName: function (abPath, ext) {
    const filename = path.basename(abPath, ext)
    const splitName = filename.split('.')
    let name = ''
    splitName.forEach(s => {
      const firstLetter = s.charAt(0).toUpperCase()
      name += firstLetter
      name += s.substr(1, s.length - 1)
    })
    return name
  }
}
