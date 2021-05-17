const onChange = require('on-change')
export default class BeanManager {
  constructor() {
    this.beanMap = {}

    this.beanFilterMap = {}

    this._watchDataMap = {}
  }

  setBeanConstructorFilter(bean, filterFunc) {
    this.beanFilterMap[bean.name] = filterFunc
  }

  /**
   * create bean
   *
   * @param name
   * @param constructor
   * @returns {Bean} return new bean
   */
  createBean(constructor, name) {
    if(!hyd.isFunction(constructor)) throw "constructor is not constructor, " + constructor
    if(!name) {
      name = constructor.name
    }
    if(!hyd.isString(name)) throw "name is not string, " + name

    let bean;
    if (typeof this.beanFilterMap[constructor.name] === 'function') {
      const result = this.beanFilterMap[constructor.name]()
      if (typeof result === 'function') {
        bean = new result()
      } else {
        bean = new constructor()
      }
    } else {
      bean = new constructor()
    }
    this.beanMap[name] = bean
    if (hyd.isFunction(bean.onShareData)) {
      // this._watchDataMap[bean.]
    }
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