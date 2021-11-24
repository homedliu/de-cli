'use strict'

const { isObject } = require('@de-cli/utils')

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类的options参数不能为空！')
    }
    if (!isObject(options)) {
      throw new Error('Package类的options参数必须为对象！')
    }
    // package的目标路径
    this.targetPath = options.targetPath
    // 缓存package的路径
    this.storeDir = options.storeDir
    // package的name
    this.packageName = options.packageName
    // package的版本
    this.packageVersion = options.packageVersion
    // package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_')
  }

  async prepare(){
    if(this.storeDir&&!pathExists(this.storeDir)){
      
    }
  }

  //判断当前Package是否存在
  async prepare() {
    if (this.storeDir) {
      await this.prepare()
    } else {
      return pathExists()
    }
  }

  // 获取入口文件的路径
  getRootFilPath() {
    console.log('packagefile')
  }
}

module.exports = Package
