(function() {
    const hydStorage = {}
    hydStorage.setItem = function(key, value) {
        hyd.sendEvent('setStorageItem', {key, value}, true);
        return undefined
    }
    hydStorage.getItem = async function(keys) {
        let returnResponse = hyd.sendEvent('getStorageItem', { keys }, true, 10000);
        return returnResponse
    }
    hydStorage.clear = function(sudo = true) {
        hyd.sendEvent('clearStorage', { sudo }, true, 10000)
        return undefined
    }
    hydStorage.removeItem = function(keys, sudo = true) {
        hyd.sendEvent('removeStorageItem', { keys, sudo }, 10000)
    }
    hydStorage.clearCookies = function() {
        hyd.sendEvent('clearCookies', {}, 10000)
    }

    // remote过来的模块不会主动释放，一定要在页面关闭前手动释放
    window.addEventListener('beforeunload', e => {
        window.hydStorage = null;
        ipcRenderer = null;
    })

    window.hydStorage = hydStorage
})()