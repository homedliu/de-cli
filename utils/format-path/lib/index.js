'use strict'

const path = require('path')

function formatPath(p) {
  // TODO
  if (p && typeof p === 'string') {
    //   获取系统的文件分隔符
    const sep = path.sep
    if (sep === '/') {
      return p
    } else {
      // window
      return p.replace(/\\/g, '/')
    }
  }
}

module.exports = formatPath
