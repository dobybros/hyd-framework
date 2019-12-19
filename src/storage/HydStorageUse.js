(function() {
    const { ipcRender } = require('electron').remote
    const hydStorage = {}
    hydStorage.setItem = function(key, value) {
        ipcRender.sendSync('hydEvent.setStorageItem', {key, value});
        return localStorage
    }
    hydStorage.getItem = function(keys) {
        let returnResponse = ipcRender.sendSync('hydEvent.getStorageItem', keys);
        return returnResponse
    }
    hydStorage.clear = function(sudo = true) {
        ipcRender.sendSync('hydEvent.clearStorage', { sudo })
        return localStorage
    }

    // remote过来的模块不会主动释放，一定要在页面关闭前手动释放
    window.addEventListener('beforeunload', e => {
        window.hydStorage = null;
        ipcRender = null;
    })

    window.hydStorage = hydStorage
})()