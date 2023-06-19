const semver = require('semver')
const colors = require('colors/safe');
const userHomer = require('user-home')
const path = require("path");
const dotEnv = require('dotenv')
const { program } = require('commander');
const { getNpmSemverVersion } = require('@waas-cli/get-npm-info')
const constant = require('./const')
const log = require('@waas-cli/log')
const exec = require('@waas-cli/exec')
const init = require('@waas-cli/init')
const pkg = require('../package.json')

async function core() {
  try {
    await prepare()
    registerCommand()
  } catch (e){
    log.error('cli', e.message)
  }
}

async function prepare(){
  try {
    checkNodeVersion()
    checkPkgVersion()
    checkRoot()
    checkUserHome()
    checkEnv()
    await checkGlobalUpdate()
  } catch (e){
    log.error('cli', e.message)
  }
}

function registerCommand(){
  program
      .name(Object.keys(pkg.bin)[0])
      .usage(`<command> [options]`)
      .version(pkg.version)
      .option('-d --debug', '是否开启调试模式', false)
      .option('-tp --targetPath <targetPath>', '是否指定本地调试文件路径', '')


  program.command('init [projectName]')
      .option('-f --force', '是否强制初始化项目')
      .action(exec)

  //debug 命令实现
  program.on('option:debug', function (){
    if (this.opts().debug) {
      process.env.LOG_LEVEL = 'verbose'
    } else {
      process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
    log.verbose('测试代码')
  })

  //
  program.on('option:targetPath', function (){
    process.env.CLI_TARGET_PATH = program.opts().targetPath
  })

  //所有命令监听
  program.on('command:*', function (obj){
    const availableCommand = program.commands.map(cmd => cmd.name()).join(',')
    log.error(colors.red(`未知命令: ${obj[0]}`))
    log.info(colors.green(`可用命令: ${availableCommand}`))
  })
  //当用户不输入任何命令时，打印帮助文档
  if (process.argv.length < 1) {
    program.outputHelp()
  }
  program.parse(process.argv);
}

function checkPkgVersion(){
  log.notice('cli', pkg.version)
}

function checkNodeVersion(){
  const currentNodeVersion = process.version
  const lowestNodeVersion = constant.LOWEST_NODE_VERSION
  if (!semver.gte(currentNodeVersion, lowestNodeVersion)) {
    throw new Error(colors.red(`waas-cli 需要安装 v${lowestNodeVersion} 以上版本的Node.js`))
  }
}

function checkRoot(){
  import('root-check').then(res => {
    //如果是root用户，会自动降级，用process.geteuid判断 返回不等于0，则表示不是root用户
    res.default()
  })
}

function checkUserHome(){
  import('path-exists').then(res => {
    if (!userHomer || !res.pathExists(userHomer)) {
      throw new Error(colors.red('当前登录用户主目录不存在！'))
    }
  })
}

function checkEnv(){
  //默认会去用户主目录查找.env文件
  const dotEnvPath = path.resolve(userHomer, '.env')
  import('path-exists').then(res => {
    if (res.pathExists(dotEnvPath)) {
      dotEnv.config({ path:  dotEnvPath})
    }
    createDefaultConfig()
    log.verbose('环境变量', process.env.WAAS_CLI_HOME)
  })
}

function createDefaultConfig(){
  const cliConfig = {}
  if (process.env.WAAS_CLI_HOME) {
    cliConfig['cliHome'] = path.resolve(userHomer, process.env.WAAS_CLI_HOME)
  } else {
    cliConfig['cliHome'] = path.resolve(userHomer, constant.DEFAULT_CLI_HOME)
  }
  process.env.WAAS_CLI_HOME = cliConfig['cliHome']
}

async function checkGlobalUpdate(){
  const currentVersion = pkg.version
  const npmName = pkg.name
  const lastVersion = await getNpmSemverVersion(pkg.version, npmName)
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(colors.yellow(`请手动更新 ${npmName}, 当前版本 ${currentVersion}, 最新版本 ${lastVersion},
     更新命令：npm install -g ${npmName}`))
  }
}

module.exports = core;
