class HydWindow {
  constructor() {
    this._electronWindow = null

    this._exitPromise = new Promise((resolve, reject) => {

    })
  }

  generate(show) {

  }

  get window() {
    return this._electronWindow
  }

  get exitFuture() {
    return this._exitPromise
  }
  on(event, callback) {
    this._electronWindow.on(event, callback)
  }
  destroy() {
    this._electronWindow&&this._electronWindow.destroy()
    this._electronWindow = null
  }
  setBounds(options) {
    this._electronWindow.setBounds(options)
  }
  show() {
    this._electronWindow&&this._electronWindow.show()
  }
  center() {
    this._electronWindow.center()
  }
  isDestroyed() {
    if (this._electronWindow) {
      return this._electronWindow.isDestroyed()
    } else {
      return true
    }
  }
  openDevTools() {
    this._electronWindow.openDevTools()
  }
}

module.exports = HydWindow
