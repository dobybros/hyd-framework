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
const SecretMaster = require('../SecretMaster.js')
const fs = require('fs')
const path = require('path')
const hydInstance = require('../../HydElectron.js').getInstance()

class HydStorage {
    constructor(storagePath = 'Acule@rn', fileName = 'test.ac', secretKey = 'AcuCom') {
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
    refreshStorage(storagePath = 'Acule@rn', fileName = 'test.ac', secretKey = 'AcuCom') {
        this.storagePath = appDataFolder(storagePath)
        this.fileName = fileName
        this.secretMaster = new SecretMaster(secretKey)
        this._initHydStorage()
    }
    _initHydStorage() {
        this.STORAGE = {}
        try {
            if (this.makeDir(this.storagePath)) {
                if (!fs.existsSync(path.join(this.storagePath, this.fileName))) {
                    fs.writeFile(path.join(this.storagePath, this.fileName), '', err => { })
                }
            }
            this._readStorageData()
                .then(data => {
                    data = data.toString()
                    try {
                        let storageData = this.secretMaster.decryption(data)
                        if (storageData) {
                            const localStorage = JSON.parse(storageData)
                            for (const key in localStorage) {
                                if (localStorage.hasOwnProperty(key)) {
                                    this.STORAGE[key] = localStorage[key]
    
                                }
                            }
                        }
                    } catch (error) {
                        this._restoreBackup()
                    }
                }).catch(err => {

                })
        } catch (error) {
            console.error('Storage error: Wrong secret key or storage is undefined, Details: ' + error)
        }
    }
    _registerStorageEvent() {
        hydInstance.registerIpcEvent('hydEvent.setStorageItem', (event, msg = {}) => {
            let { keys, value } = msg
            this.setItem(keys, value)
            event.returnValue = undefined
        })
        hydInstance.registerIpcEvent('hydEvent.getStorageItem', (event, msg = {}) => {
            let keys = msg.keys
            let response = this.getItem(keys)
            event.returnValue = response
        })
        hydInstance.registerIpcEvent('hydEvent.clearStorage', (event, msg = {}) => {
            let sudo = msg.sudo
            this.clear(sudo)
            event.returnValue = undefined
        })
        hydInstance.registerIpcEvent('hydEvent.removeStorageItem', (event, msg = {}) => {
            let { keys, sudo } = msg
            this.removeItems(keys, sudo)
            event.returnValue = undefined
        })
        hydInstance.registerIpcEvent('hydEvent.clearCookies', (event, msg = {}) => {
            this.removeItems('cookies', true)
            event.returnValue = undefined
        })
    }
    setItem(key, value, notCommit) {
        // 支持key, value; Object的存储
        let hasOperation = false;
        if (this.judgeType(key) === 'Object') {
            const trueObject = key
            for (const trueKey in trueObject) {
                if (this.judgeType(trueObject[trueKey]) !== 'Function') {
                    this.STORAGE[trueKey] = trueObject[trueKey]
                    hasOperation = hasOperation || true
                }
            }
        } else {
            this.STORAGE[key] = value
            hasOperation = true;
        }
        if (hasOperation && !notCommit) {
            this._commitStorage()
                .then(res => { })
                .catch(err => { this._restoreBackup() })
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
                .then(res => { })
                .catch(err => { this._restoreBackup() })
        }
    }
    clear(sudo) {
        this.STORAGE = {}
        if (sudo) {
            this._commitStorage()
                .then(res => { })
                .catch(err => { this._restoreBackup })
        }
    }
    _commitStorage() {
        return this._backupCommit()
    }
    _backupCommit() {
        // 创建备份文件
        return new Promise((resolve, reject) => {
            try {
                if (this.makeDir(this.storagePath)) {
                    // 先确定两个文件都存在
                    if (!fs.existsSync(path.join(this.storagePath, this.fileName))) {
                        fs.writeFileSync(path.join(this.storagePath, this.fileName), '', err => { })
                    }
                    if (!fs.existsSync(path.join(this.storagePath, this.fileName + '.BKP'))) {
                        fs.writeFileSync(path.join(this.storagePath, this.fileName + '.BKP'), '', err => { throw err });
                    }
                    // 加密后转为二进制
                    let writeData = this.secretMaster.encryption(JSON.stringify(this.STORAGE))
                    // 写入备份文件
                    fs.writeFileSync(path.join(this.storagePath, this.fileName + '.BKP'), writeData, 'utf-8')
                    fs.renameSync(path.join(this.storagePath, this.fileName + '.BKP'), path.join(this.storagePath, this.fileName + '.temp'));
                    fs.renameSync(path.join(this.storagePath, this.fileName), path.join(this.storagePath, this.fileName + '.BKP'));
                    fs.renameSync(path.join(this.storagePath, this.fileName + '.temp'), path.join(this.storagePath, this.fileName));
                    resolve()
                }
            } catch (error) {
                if (error) {
                    reject(error)
                }
            }
        })
    }
    _restoreBackup() {
        try {
            fs.unlink(path.join(this.storagePath, this.fileName), err => { throw err })
            if (fs.existsSync(path.join(this.storagePath, this.fileName + '.BKP'))) {
                fs.renameSync(path.join(this.storagePath, this.fileName + '.BKP'), path.join(this.storagePath, this.fileName));
            }
            this._initHydStorage()
        } catch (error) {
            console.log(error)
        }
    }
    _readStorageData() {
        return new Promise((resolve, reject) => {
            fs.readFile(path.join(this.storagePath, this.fileName), (err, data) => {
                if (!err) {
                    resolve(data);
                } else {
                    reject(err)
                }
            })
        })
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