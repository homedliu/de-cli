'use strict'

const Command = require('@de-cli/command')
const log = require('@de-cli/log')

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
    const template = await getProjectTemplate()
  }
}

function init(argv) {
  return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
