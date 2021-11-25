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
  const packageVersion = '1.1.0'

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

    if (await pkg.exists()) {
      //更新package包
      log.verbose('更新', `${packageName}`)
      await pkg.update()
    } else {
      log.verbose('安装', `${packageName}`)
      //安装package包
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    })
  }
  const rootFile = pkg.getRootFilePath()
  if (rootFile) {
    try {
      // 在当前进程中调用
      // require(rootFile).call(null, Array.from(arguments))
      // 在node子进程中调用
      const args = Array.from(arguments)
      const cmd = args[args.length - 1]
      const o = Object.create(null)
      o.childValue = cmd.opts()
      o.parentValue = cmd.parent.opts()
      Object.keys(cmd).forEach((key) => {
        if (
          cmd.hasOwnProperty(key) &&
          !key.startsWith('_') &&
          key !== 'parent'
        ) {
          o[key] = cmd[key]
        }
      })
      args[args.length-1]=o
      
    } catch (e) {
      log.error(e)
    }
  }

  console.log(pkg.getRootFilePath())
}
module.exports = exec
