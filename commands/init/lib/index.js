'use strict'

const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const glob = require('glob')
const ejs = require('ejs')
const Command = require('@de-cli/command')
const Package = require('@de-cli/package')
const { spinnerStart, sleep, execAsync } = require('@de-cli/utils')
const userHome = require('os').homedir()
const log = require('@de-cli/log')
const inquirer = require('inquirer')
const semver = require('semver')
const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'

//白名单检测，预防数据库被改
const WHITE_COMMAND = ['npm', 'cnpm']

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
        this.projectInfo = projectInfo
        //2.下载模板
        await this.downloadTemplate()
        //3.安装模板
        await this.installTemplate()
      }
    } catch (e) {
      log.error(e.message)
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(e)
      }
    }
  }

  //安装模板
  async installTemplate() {
    if (this.templateInfo) {
      if (!this.templateInfo.type) {
        this.templateInfo.type = TEMPLATE_TYPE_NORMAL
      }
      if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
        //标准安装
        await this.installNormalTemplate()
      } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
        //自定义安装
        await this.installCustomTemplate()
      } else {
        throw new Error('无法识别项目模板类型！')
      }
    } else {
      throw new Error('项目模板信息不存在！')
    }
  }

  checkCommand(cmd) {
    if (WHITE_COMMAND.includes(cmd)) {
      return cmd
    }
    return null
  }

  async execCommand(command, msg) {
    let ret
    if (command) {
      const cmdArray = command.split(' ')
      const cmd = this.checkCommand(cmdArray[0])
      if (!cmd) {
        throw new Error('命令不存在！命令：' + command)
      }
      const args = cmdArray.slice(1)
      ret = await execAsync(cmd, args, {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
    }
    if (ret !== 0) {
      throw new Error(msg)
    }
    return ret
  }

  ejsRender(options) {
    const dir = process.cwd()
    const projectInfo = this.projectInfo
    return new Promise((resolve, reject) => {
      glob(
        '**',
        {
          cwd: dir,
          ignore: options.ignore || '',
          nodir: true,
        },
        (err, files) => {
          if (err) {
            reject(err)
          }
          Promise.all(
            files.map((file) => {
              const filePath = path.join(dir, file)
              return new Promise((resolve1, reject1) => {
                ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
                  if (err) {
                    reject1(err)
                  } else {
                    //重新写入
                    fse.writeFileSync(filePath, result)
                    resolve1(result)
                  }
                })
              })
            })
          )
            .then(() => {
              resolve()
            })
            .catch((err) => {
              reject(err)
            })
        }
      )
    })
  }

  //安装标准模板
  async installNormalTemplate() {
    log.verbose('templateInfo', this.templateInfo)
    //拷贝模板代码至当前目录
    let spinner = spinnerStart('正在安装模板...')
    await sleep()
    try {
      const templatePath = path.resolve(
        this.templateNpm.cacheFilePath,
        'template'
      )
      const targetPath = process.cwd()
      fse.ensureDirSync(templatePath)
      fse.ensureDirSync(targetPath)
      fse.copySync(templatePath, targetPath)
    } catch (e) {
    } finally {
      spinner.stop(true)
      log.success('模板安装成功！')
    }
    const ignore = ['node_modules/**', 'public/**']
    await this.ejsRender({ ignore })

    const { installCommand, startCommand } = this.templateInfo
    //依赖安装
    // await this.execCommand(installCommand, '依赖安装过程中失败！')
    //启动命令执行
    // await this.execCommand(startCommand, '启动命令失败！')
  }
  //自定义安装
  async installCustomTemplate() {
    console.log('自定义安装')
  }

  //下载模板
  async downloadTemplate() {
    // log.verbose(this.projectInfo, this.template)
    //1.通过项目模板API获取项目模板信息
    //1.1 通过egg.js搭建一套后端系统API
    //1.2 通过npm存储项目模板
    //1.3 将项目模板信息存储到mongodb数据库中
    //1.4通过egg.js获取mongodb中的数据并且通过API返回

    const { projectTemplate } = this.projectInfo
    const templateInfo = this.template.find(
      (item) => item.npmName === projectTemplate
    )
    const targetPath = path.resolve(userHome, '.de-cli', 'template')
    const storeDir = path.resolve(targetPath, 'node_modules')
    const { npmName, version } = templateInfo
    this.templateInfo = templateInfo
    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    })
    if (!(await templateNpm.exists())) {
      const spinner = spinnerStart('正在下载模板...')
      await sleep()

      try {
        await templateNpm.install()
        spinner.stop(true)
        log.success('下载模板成功')
        this.templateNpm = templateNpm
      } catch (e) {
        throw e
      } finally {
        spinner.stop(true)
      }
    } else {
      const spinner = spinnerStart('正在更新模板...')
      await sleep()
      try {
        await templateNpm.update()
        spinner.stop(true)
        log.success('更新模板成功')
        this.templateNpm = templateNpm
      } catch (e) {
        throw e
      } finally {
        spinner.stop(true)
      }
    }
  }

  //准备阶段
  async prepare() {
    //0.判断项目模板是否存在
    const template = await getProjectTemplate()

    if (!template || template.length === 0) {
      throw new Error('项目模板不存在')
    }
    this.template = template
    //1.判断当前文件夹是否存在项目
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
    function isValidName(v) {
      return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
        v
      )
    }
    let projectInfo = {}
    let isProjectNameValid = false
    if (isValidName(this.projectName)) {
      isProjectNameValid = true
      projectInfo.projectName = this.projectName
    }
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
    const projectNamePrompt = {
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
          if (!isValidName(v)) {
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
    }
    const projectPrompt = []
    if (!isProjectNameValid) {
      projectPrompt.push(projectNamePrompt)
    }
    if (type === TYPE_PROJECT) {
      projectPrompt.push(
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
        {
          type: 'list',
          name: 'projectTemplate',
          message: '请选择项目模板',
          choices: this.createTemplateChoice(),
        }
      )
      const project = await inquirer.prompt(projectPrompt)
      projectInfo = {
        ...projectInfo,
        type,
        ...project,
      }
    } else if (type === TYPE_COMPONENT) {
    }

    // 生成classname
    if (projectInfo.projectName) {
      projectInfo.name = projectInfo.projectName
      projectInfo.className = require('kebab-case')(
        projectInfo.projectName
      ).replace(/^-/, '')
    }
    if (projectInfo.projectVersion) {
      projectInfo.version = projectInfo.projectVersion
    }

    return projectInfo
  }

  createTemplateChoice() {
    return this.template.map((item) => ({
      value: item.npmName,
      name: item.name,
    }))
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
