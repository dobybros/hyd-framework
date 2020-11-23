import { hyd } from '../hyd/hyd'
import { getEvents } from './HydEventsConstant'

const onChange = require('on-change')

export default class BeanManager {
  constructor() {
    this.beanMap = {}

    this.beanFilterMap = {}

    this._watchDataMap = {}

    this._initDataMap = {}

    this._beanManagerNumber = hyd.generateId()

    this.events = getEvents(this)

    this.registerEvents()

    this.registerRemoteCallbacks()
  }

  registerEvents() {
  }

  registerRemoteCallbacks() {
    this.bindGetRemoteData = this.getRemoteData.bind(this)
  }

  setBeanConstructorFilter(bean, filterFunc) {
    this.beanFilterMap[bean.name] = filterFunc
  }

  getRemoteData({ beanName }, callback) {
    let remoteData = undefined
    if (this.beanMap[beanName]) {
      if (this._initDataMap[beanName]) {
        remoteData = this._initDataMap[beanName]
      }
    }
    callback(remoteData || {})
  }

  /**
   * create bean
   *
   * @param name
   * @param constructor
   * @returns {Bean} return new bean
   */
  async createBean(constructor, name) {
    if(!hyd.isFunction(constructor)) throw "constructor is not constructor, " + constructor
    if(!name) {
      name = constructor.name
    }
    if(!hyd.isString(name)) throw "name is not string, " + name

    let bean;
    if (typeof this.beanFilterMap[constructor.name] === 'function') {
      const result = this.beanFilterMap[constructor.name]()
      if (typeof result === 'function') {
        constructor = result
      }
    }
    // electron端就先去查一下有没有注册好了的
    let extendInitData = {};
    if (window.electronRenderer) {
      try {
        const findOutResult = await electronRenderer.getBeanFromMainProcess(name)
        if (typeof findOutResult === 'object') {
          extendInitData = findOutResult
        }
      } catch (error) {
        
      }
    }


    bean = new constructor()
    if (extendInitData) {
      bean.
    }
    this.beanMap[name] = bean
    // if (hyd.isFunction(bean.onShareData)) {
    //   // sync shared data
    //   this._watchDataMap[name] = onChange(Object.assign({}, bean.onShareData(), { ___beanName: name, ___managerId: this._beanManagerNumber }), function(path, value, prevValue, name) {
    //     const beanName = this.___beanName
    //     const from = this.___managerId
    //     hyd.sendEvent(this.events.SYNC_ONSHAREDATA, {
    //       path, value, prevValue, name, beanName, from
    //     })
    //   })
    // }

    if (hyd.isFunction(bean.onInitData)) {
      // sync init data
      hyd.extend(bean.onInitData(), extendInitData)
    }

    this.setBeanCreateToMainProcess(name, this._beanManagerNumber)
    return bean
  }

  /**
   * register existing bean
   *
   * @param object
   * @param name
   * @returns {Bean} return old
   */
  registerBean(object, name) {
    if(!name) {
      name = object.constructor.name
    }

    let old = this.beanMap[name]
    this.beanMap[name] = object
    return old
  }

  /**
   * get bean from memory
   *
   * @param name
   * @returns {V | undefined}
   */
  getBean(name, forceCreate) {
    if(hyd.isFunction(name)) {
      let constructor = name;
      name = constructor.name

      let bean = this.beanMap[name]
      if(!bean && forceCreate) {
        this.createBean(constructor)
      }
    }
    if(!hyd.isString(name)) throw "name is not string, " + name

    return this.beanMap[name]
  }

  getBeanOrCreate(name) {
    return this.getBean(name, true)
  }

  removeBean(name) {
    if(hyd.isFunction(constructor)) {
      name = constructor.name
    }
    if(!hyd.isString(name)) throw "name is not string, " + name

    let bean = this.beanMap[name]
    this._releaseBean(bean)
    delete this.beanMap[name]
    return bean
  }

  _releaseBean(bean) {
    if(bean && hyd.isFunction(bean.release)) {
      try {
        bean.release()
      } catch(t) {console.error("Release bean failed", t, "bean", bean)}
    }
  }

  clear() {
    const newBeanMap = {}
    Object.keys(this.beanMap).forEach((bean, key) => {
      bean = this.beanMap[bean]
      if (hyd.isFunction(bean._configBean)) {
        const config = bean._configBean()
        if (config && config.isStaticBean) {
          newBeanMap[key] = bean
        } else {
          this._releaseBean(bean)
        }
      } else {
        this._releaseBean(bean)
      }
    })
    this.beanMap = newBeanMap
  }
}