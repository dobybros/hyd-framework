(function() {
    const { ipcRenderer } = require('electron')
    const hydStorage = {}
    hydStorage.ipc = ipcRenderer
    hydStorage.setItem = function(key, value) {
        let ipcSender = ipc || this.ipc
        ipcSender.sendSync('hydEvent.setStorageItem', {key, value});
        return localStorage
    }
    hydStorage.getItem = function(keys) {
        let ipcSender = ipc || this.ipc
        let returnResponse = ipcSender.sendSync('hydEvent.getStorageItem', { keys });
        return returnResponse
    }
    hydStorage.clear = function(sudo = true) {
        let ipcSender = ipc || this.ipc
        ipcSender.sendSync('hydEvent.clearStorage', { sudo })
        return localStorage
    }
    hydStorage.removeItem = function(keys, sudo = true) {
        let ipcSender = ipc || this.ipc
        ipcSender.sendSync('hydEvent.removeStorageItem', { keys, sudo })
    }

    // remote过来的模块不会主动释放，一定要在页面关闭前手动释放
    window.addEventListener('beforeunload', e => {
        window.hydStorage = null;
        ipcRenderer = null;
    })

    window.hydStorage = hydStorage
})()