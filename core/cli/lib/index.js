const semver = require('semver')
const colors = require('colors/safe');
const pkg = require('../package.json')
const log = require('@waas-cli/log')
const constant = require('./const')
const userHomer = require('user-home')
const path = require("path");
const argv = require('minimist')(process.argv.slice(2));
const dotEnv = require('dotenv')
const { getNpmVersions, getNpmSemverVersion } = require('@waas-cli/get-npm-info')


async function core() {
  try {
    checkNodeVersion()
    checkPkgVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs()
    checkEnv()
    await checkGlobalUpdate()
  } catch (e){
    log.error('cli', e.message)
  }
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

function checkInputArgs(){
  checkDebugArg()
}

function checkDebugArg(){
  if (argv.debug){
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
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
