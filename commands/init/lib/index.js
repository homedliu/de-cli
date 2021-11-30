'use strict'

const fs = require('fs')
const fse = require('fs-extra')
const Command = require('@de-cli/command')
const log = require('@de-cli/log')
const inquirer = require('inquirer')
const semver = require('semver')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

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
      if (projectInfo) {
        log.verbose('projectInfo', projectInfo)
        this.downloadTemplate()
      }
      //2.下载模板
      //3.安装模板
    } catch (e) {
      log.error(e.message)
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(e)
      }
    }
  }

  //下载模板
  downloadTemplate() {
    //1.通过项目模板API获取项目模板信息
    //1.1 通过egg.js搭建一套后端系统API
    //1.2 通过npm存储项目模板
    //1.3 将项目模板信息存储到mongodb数据库中
    //1.4通过egg.js获取mongodb中的数据并且通过API返回
  }

  //准备阶段
  async prepare() {
    //1.判断项目模板是否存在
    //1.1当前命令行运行的路径
    const localPath = process.cwd()
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false
      if (!this.force) {
        //询问是否继续创建
        ifContinue = (
          await inquirer.prompt({
            type: 'confirm',
            name: 'ifContinue',
            default: false,
            message: '当前文件夹不为空，是否继续创建项目？',
          })
        ).ifContinue
        if (!ifContinue) {
          return
        }
      }
      //2.是否启用强更新
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
    return this.getProjectInfo()
    // const template = await getProjectTemplate()
  }

  //获取需要创建项目的基本信息
  async getProjectInfo() {
    let projectInfo = {}
    //1.选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TYPE_PROJECT,
      choices: [
        {
          name: '项目',
          value: TYPE_PROJECT,
        },
        {
          name: '组件',
          value: TYPE_COMPONENT,
        },
      ],
    })
    log.verbose('type', type)
    //2.获取项目的基本信息
    if (type === TYPE_PROJECT) {
      const project = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '请输入项目名称',
          default: '',
          validate(v) {
            const done = this.async()
            setTimeout(() => {
              //1.首字符必须为英文字符
              //2.尾字符必须为英文或数字，不能为字符
              //3.字符仅容许“_-”
              if (
                !/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
                  v
                )
              ) {
                done('请输入合法的项目名称！')
              }
              done(null, true)
            }, 0)

            // return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
            //   v
            // )
          },
          filter(v) {
            return v
          },
        },
        {
          type: 'input',
          name: 'projectVersion',
          message: '请输入版本号',
          default: '1.0.0',
          validate(v) {
            const done = this.async()
            setTimeout(() => {
              if (!!!semver.valid(v)) {
                done('请输入合法的版本号！')
              }
              done(null, true)
            }, 0)
          },
          filter(v) {
            if (!!semver.valid(v)) {
              return semver.valid(v)
            } else {
              return v
            }
          },
        },
      ])
      projectInfo = {
        type,
        ...project,
      }
    } else if (type === TYPE_COMPONENT) {
    }
    return projectInfo
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
