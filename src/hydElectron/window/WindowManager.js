/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2020-11-10 10:51:08
 * @LastEditTime: 2020-11-24 13:58:26
 * @FilePath: \tc-class-client-electronjsd:\worklist\hyd-framework\src\hydElectron\window\WindowManager.js
 */
const { ipcMain } = require('electron')
class WindowManager {
  constructor() {
    this._windowMap = {
      features: {},
      services: {}
    }

    this.bindCloseWindow = this.closeWindow.bind(this)
    this.bindSetWindow = this.setWindow.bind(this)
    this.bindHideWindow = this.hideWindow.bind(this)
    this.registerWindowEvents()
  }

  addWindow(type, obj) {
    const id = obj.windowId
    switch (type) {
      case 'feature':
        if (id && !this._windowMap.features[id]) {
          this._windowMap.features[id] = obj
        }
        break;
      case 'service':
        if (id && !this._windowMap.services[id]) {
          this._windowMap.services[id] = obj
        }
      default:
        break;
    }
  }

  getWinById(winId) {
    let targetWin = null;
    if (this._windowMap.features[winId]) {
      targetWin = this._windowMap.features[winId]
    } else if (this._windowMap.services[winId]) {
      targetWin = this._windowMap.services[winId]
    }

    return targetWin
  }

  removeWindow(winId) {
    winId = winId + ''
    let targetWin;
    if (this._windowMap.features[winId]) {
      targetWin = this._windowMap.features[winId]
      if (targetWin && typeof targetWin.release === 'function') {
        targetWin.release();
        delete this._windowMap.features[winId];
      }
    } else if (this._windowMap.services[WinId]) {
      targetWin = this._windowMap.services[WinId]
      if (targetWin && typeof targetWin.release === 'function') {
        targetWin.release();
        delete this._windowMap.features[winId];
      }
    }
  }

  registerWindowEvents() {
    ipcMain.on('hydEvent.closeCurrentWindow', this.bindCloseWindow)
    ipcMain.on('hydEvent.hideCurrentWindow', this.bindHideWindow)
    ipcMain.on('hydEvent.setCurrentWindowStatus', this.bindSetWindow)
  }

  closeWindow(_, id, close, reason) {
    const targetWindow = this.getWinById(id)
    if (targetWindow) {
      targetWindow.windowClose(close, reason)
    }
  }
  hideWindow(_, id ) {
    const targetWindow = this.getWinById(id)
    if (targetWindow) {
      targetWindow.windowHide()
    }
  }
  setWindow(_, id, obj) {
    const targetWindow = this.getWinById(id)
    if (targetWindow) {
      targetWindow.setWindow(obj)
    }
  }
}

const instance = new WindowManager()

module.exports = instance