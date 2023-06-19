'use strict';
const path = require('path')
const util = require('@waas-cli/utils')
const formatPath = require('@waas-cli/format-path')
const npminstall = require('npminstall');
const { getDefaultRegistry, getLatestVersion } = require('@waas-cli/get-npm-info')


class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类的options不能为空')
    }
    if (!util.isObject(options)) {
      throw new Error('Package类的options必须为对象')
    }
    //package的路径
    this.targetPath = options.targetPath
    //package的存储路径
    this.storePath = options.storePath
    //package的name
    this.packageName = options.packageName
    //package的version
    this.packageVersion = options.packageVersion
  }

  getCachePkgPath(version){
    return path.resolve(this.storePath, `.store/${this.packageName}@${version}/node_modules/${this.packageName}`)
  }

  async prepare(){
    let version = this.packageVersion
    if (this.packageVersion === 'latest') {
      version = await getLatestVersion(this.packageName)
    }
    const pkgPath = this.getCachePkgPath(version)
    const { pathExists } = await import('path-exists')
    return pathExists(pkgPath)
  }

  //判断当前package是否存在
  async exist(){
    if (this.storePath) {
      return await this.prepare()
    } else {
      const { pathExists } = await import('path-exists')
      return pathExists(this.targetPath)
    }
  }

  //安装package
  install(){
    (async () => {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storePath,
        pkgs: [{ name: this.packageName, version: this.packageVersion }],
        registry: getDefaultRegistry(),
      });
    })().catch(err => {
      console.error(err);
    });
  }

  //更新package
  async update(){
    const latestVersion = await getLatestVersion(this.packageName)
    const latestPkgPath = this.getCachePkgPath(latestVersion)
    const { pathExists } = await import('path-exists')
    if (!await pathExists(latestPkgPath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storePath,
        pkgs: [{ name: this.packageName, version: latestVersion }],
        registry: getDefaultRegistry(),
      });
      this.packageVersion = latestVersion
    }
  }

  //获取入口文件的路径
  async getMainFilePath(){
    async function _getRootPath(pkgPath){
      const { packageDirectory } = await import('pkg-dir')
      const rootPath = await packageDirectory({ cwd: pkgPath })
      if (rootPath) {
        const pkgFile = require(path.resolve(rootPath, 'package.json'))
        if (pkgFile?.main) {
          return formatPath(path.resolve(rootPath, pkgFile.main))
        }
      }
      return null
    }
    if (this.storePath) {
      return await _getRootPath(this.getCachePkgPath(this.packageVersion))
    } else {
      return await _getRootPath(this.targetPath)
    }
  }
}
module.exports = Package;
