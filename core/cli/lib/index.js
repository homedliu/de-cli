'use strict'

const path = require('path')
const colors = require('colors/safe')
const pathExists = require('path-exists')
const log = require('@de-cli/log')
const pkg = require('../package.json')
const userHome = require('os').homedir()

const constant = require('./const')

async function core() {
  try {
    await prepare()
  } catch (e) {
    console.log(e.message)
  }
}

async function prepare() {
  //获取package版本
  checkPkgVersion()
  //获得root权限
  checkRoot()
  //判断当前用户主目录
  checkUserHome()
  //获取环境变量文件
  checkEnv()
  await checkGlobalUpdate()
}

function checkPkgVersion() {
  log.info('cli', pkg.version)
}

function checkRoot() {
  const rootCheck = require('root-check')
  rootCheck()
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登录用户主目录不存在！'))
  }
}

function checkEnv() {
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    })
  }
  createDefaultConfig()
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PARTH = cliConfig.cliHome
}

async function checkGlobalUpdate() {
  const currentVersion = pkg.version
  const npmName = pkg.name
  const {} = require('@de-cli/get-npm-info')
}

module.exports = core
