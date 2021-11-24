'use strict'

const path = require('path')
const Package = require('@de-cli/package')
const log = require('@de-cli/log')

const CACHE_DIR = 'dependencies'
const SETTINGS = {
  init: '@imooc-cli/core',
}

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH
  let storeDir = ''
  let pkg
  log.verbose('targetPath', targetPath)
  log.verbose('homePath', homePath)

  const cmdObj = arguments[arguments.length - 1]
  const cmdName = cmdObj.name()
  const packageName = SETTINGS[cmdName]
  const packageVersion = 'latest'

  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR)
    storeDir = path.resolve(targetPath, 'node_modules')
    log.verbose('targetPath', targetPath)
    log.verbose('storeDir', storeDir)
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    })
    
  }
  // TODO
  //   pkg = new Package()
  //   pkg.getRootFilPath()
}
module.exports = exec
