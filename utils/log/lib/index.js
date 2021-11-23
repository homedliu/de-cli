'use strict'

const log = require('npmlog')
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'
log.heading = 'de-cli' //修改前缀
log.headingStyle = { fg: 'blue', bg: 'white' } //自定义前缀样式

log.addLevel('success', 2000, { fg: 'green', bold: true })

module.exports = log
