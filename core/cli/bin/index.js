#! /usr/bin/env node
const importLocal = require('import-local')

//判断并执行本地是否存在该包
//因为每个包执行的路径文件不一样，所以需要传__filename
if (importLocal(__filename)) {
  require('npmlog').info('cli', '正在使用 de-cli-dev 本地版本')
} else {
  require('../lib')(process.argv.slice(2))
}
