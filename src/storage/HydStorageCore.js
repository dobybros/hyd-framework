// Render进程和主进程都注册hydEvent.updataStorage， 接收到之后， 判断版本是否是上一个版本（例如收到的是5版本， 如果自己的是4版本， 就可以升级替换），如果有版本落差（例如收到5版本， 自己的是3版本）回调hyd.localstorage.versionConflict(currentData, currentVersion, newData, newVersion)函数。 
// 如果hyd.localstorage.versionConflict没有实现， 默认采用高版本覆盖低版本原则

// set是放到一个缓存对象中。 
// hyd.localStorage.setItem

// 发送事件hydEvent.updataStorage, 数据是全量localStorage， 并更新版本号。 合并缓存对象到本地localstorage， 发送事件之后清空缓存对象
// hyd.localStorage.commit

// 从本地localstorage中获取
// hyd.localStorage.getItem

// 任何一个render进程启动时， 发送事件hydEvent.updataStorage let response = ipc.sendSync('asd', data)

// hyd.localStorage.clear

const appDataFolder = require('app-data-folder')
const SecretMaster = require('../libs/SecretMaster.js')
const fs = require('fs')
const path = require('path')
const { ipcMain } = require('electron')

class HydStorage {
    constructor(storagePath = 'Aucle@rn', fileName = 'test.ac', secretKey = 'AcuCom') {
        this.storagePath = appDataFolder(storagePath)
        this.fileName = fileName
        this.secretMaster = new SecretMaster(secretKey)
        this._initHydStorage()
        this._registerStorageEvent()
    }
    static getInstance(storagePath, secretKey) {
        if (!this.instanceStorage) {
            this.instanceStorage = new HydStorage(storagePath, secretKey)
        }
        return this.instanceStorage
    }
    _initHydStorage() {
        this.STORAGE = {}
        try {
            if (this.makeDir(this.storagePath)) {
                if (!fs.existsSync(path.join(this.storagePath, this.fileName))) {
                    fs.writeFile(path.join(this.storagePath, this.fileName), '', err => { })
                }
            }
            fs.readFile(path.join(this.storagePath, this.fileName), (err, data) => {
                if (!err) {
                    data = data.toString()
                    let storageData = this.secretMaster.decryption(data)
                    if (storageData) {
                        this.STORAGE = JSON.parse(storageData)
                    }
                }
            })
        } catch (error) {
            console.error('Storage error: Wrong secret key or storage is undefined, Details: ' + error)
        }
    }
    _registerStorageEvent() {
        ipcMain.on('hydEvent.setStorageItem', (event, msg = {}) => {
            let { key, value } = msg
            this.setItem(key, value)
            event.returnValue = undefined
        })
        ipcMain.on('hydEvent.getStorageItem', (event, msg = {}) => {
            let keys = msg.keys
            let response = this.getItem(keys)
            event.returnValue = response
        })
        ipcMain.on('hydEvent.clearStorage', (event, msg = {}) => {
            let sudo = msg.sudo
            this.clear(sudo)
            event.returnValue = undefined
        })
        ipcMain.on('hydEvent.removeStorageItem', (event, msg = {}) => {
            let { keys, sudo } = msg
            this.removeItems(keys, sudo)
            event.returnValue = undefined
        })
    }
    setItem(key, value) {
        // 支持key, value; Object的存储
        let hasOperation = false;
        if (value) {
            this.STORAGE[key] = value
            hasOperation = true;
        } else {
            if (this.judgeType(key) === 'Object') {
                const trueObject = key
                for (const trueKey in trueObject) {
                    if (this.judgeType(trueObject[trueKey]) !== 'Function') {
                        this.STORAGE[trueKey] = trueObject[trueKey]
                        this.hasOperation = this.hasOperation || true
                    }
                }
            }
        }
        if (hasOperation) {
            this._commitStorage()
        }
    }
    getItem(keys) {
        if (this.judgeType(keys) === 'String') {
            return this.STORAGE[keys]
        } else if (this.judgeType(keys) === 'Array') {
            const returnArray = []
            keys.forEach(key => {
                returnArray.push(this.STORAGE[key])
            });
            return returnArray
        } else {
            return undefined
        }
    }
    removeItems(keys, sudo) {
        if (this.judgeType(keys) === 'String') {
            if (this.STORAGE[keys]) {
                delete this.STORAGE[keys]
            }
        } else if (this.judgeType(keys) === 'Array') {
            keys.forEach(key => {
                this.removeItems(key, false)
            });
        }
        if (sudo) {
            this._commitStorage()
        }
    }
    clear(sudo) {
        this.STORAGE = {}
        if (sudo) {
            this._commitStorage()
        }
    }
    _commitStorage() {
        try {
            fs.writeFile(path.join(this.storagePath, this.fileName), this.secretMaster.encryption(JSON.stringify(this.STORAGE)), err => { })
        } catch (error) {
            // console.error('Storage error: ' + error)
        }
    }
    judgeType(o) {
        return Object.prototype.toString.call(o).split(' ')[1].split(']')[0]
    }
    makeDir(dirpath) {
        if (!fs.existsSync(dirpath)) {
            var pathtmp;
            let splitSymbol;
            if (dirpath.indexOf('/') !== -1) {
                splitSymbol = '/'
            } else {
                splitSymbol = '\\'
            }
            dirpath.split(splitSymbol).forEach(function (dirname) {
                if (pathtmp) {
                    pathtmp = path.join(pathtmp, dirname);
                }
                else {
                    //如果在linux系统中，第一个dirname的值为空，所以赋值为"/"
                    if (dirname) {
                        pathtmp = dirname;
                    } else {
                        pathtmp = "/";
                    }
                }
                if (!fs.existsSync(pathtmp)) {
                    if (!fs.mkdirSync(pathtmp)) {
                        return false;
                    }
                }
            });
        }
        return true;
    }
}

module.exports = {
    HydStorage
}