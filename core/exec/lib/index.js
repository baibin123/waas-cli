'use strict';
const path = require('path')
const Package = require('@waas-cli/package')
const log = require('@waas-cli/log')

const SETTINGS = {
  init: 'lodash'
}
const CACHE_DIR = 'dependencies'

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH
  let storePath = ''
  let pkg = ''
  const homePath = process.env.WAAS_CLI_HOME
  log.verbose('targetPath: ', targetPath)
  log.verbose('homePath: ', homePath)
  const cmdObj = arguments[arguments.length - 1]
  const packageName = SETTINGS[cmdObj.name()]
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR)
    storePath = path.resolve(targetPath, 'node_modules')
    log.verbose('targetPath: ', targetPath)
    log.verbose('storePath: ', storePath)
    pkg = new Package({
      targetPath,
      storePath,
      packageName,
      packageVersion: 'latest'
    })
    if (pkg.exist()) {
      pkg.update()
    } else {
      pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion: 'latest'
    })
  }
  const rootFile = await pkg.getMainFilePath()
  console.log('******', rootFile)
  //require(rootFile).apply(null, arguments)两种方式调用都可以
  if (rootFile) {
    require(rootFile)(...arguments)
  }
}
module.exports = exec;
