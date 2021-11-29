'use strict'

const fs = require('fs')
const fse = require('fs-extra')
const Command = require('@de-cli/command')
const log = require('@de-cli/log')
const inquirer = require('inquirer')

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._cmd.childValue.force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }
  async exec() {
    try {
      //1.准备阶段
      const projectInfo = await this.prepare()
      //2.下载模板
      //3.安装模板
    } catch (e) {
      log.error(e.message)
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(e)
      }
    }
  }

  async prepare() {
    //1.判断项目模板是否存在
    //1.1当前命令行运行的路径
    const localPath = process.cwd()
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false
      if (!this.force) {
        //询问是否继续创建
        ifContinue = await inquirer.prompt({
          type: 'confirm',
          name: 'ifContinue',
          default: false,
          message: '当前文件夹不为空，是否继续创建项目？',
        }).ifContinue
      }

      if (ifContinue || this.force) {
        //给用户做二次确认
        const { confirmDelete } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          default: 'false',
          message: '是否确认清空当前目录下的文件？',
        })
        if (confirmDelete) {
          //清空当前目录
          fse.emptyDirSync(localPath)
        }
      }
    }
    //2.是否启用强更新
    //3.选择创建项目或组件
    //4.获取项目的基本信息
    // const template = await getProjectTemplate()
  }

  isDirEmpty(localPath) {
    //1.2获取路径下的文件文件夹名称
    let fileList = fs.readdirSync(localPath)
    //过滤文件
    fileList = fileList.filter(
      (file) => !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
    )
    return !fileList || fileList.length <= 0
  }
}

function init(argv) {
  return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
