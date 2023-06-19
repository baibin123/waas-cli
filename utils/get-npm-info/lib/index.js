const axios = require("axios");
const semver = require('semver')

function getNpmInfo(npmName, registry) {
  if (!npmName) return
  const registryUrl = getDefaultRegistry()
  const url = `${registryUrl}/${npmName}`
  return axios.get(url).then(res => {
    if (res.status === 200) {
      return res.data
    }
    return
  }).catch(err => Promise.reject(err))
}

function getDefaultRegistry(isOrigin = false){
  return isOrigin ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}

async function getLatestVersion(npmName){
  const versions = await getNpmVersions(npmName, getDefaultRegistry())
  if (versions) {
    return versions.sort((a, b) => semver.gt(b, a))[0]
  }
  return  null
}

async function getNpmVersions(npmName, registry) {
  try {
    const res = await getNpmInfo(npmName, registry)
    if (res) return Object.keys(res.versions)
    return []
  } catch (e){
    return Promise.reject(e)
  }
}

function getSemverVersions(locVersion, versions){
  return versions.filter(v => semver.satisfies(v, `^${locVersion}`))
      .sort((a, b) => semver.gt(b, a))
}

async function getNpmSemverVersion(locVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry)
  const newVersions = getSemverVersions(locVersion, versions)
  if (newVersions?.length > 0) return newVersions[0]
}

module.exports = {
  getNpmInfo,
  getNpmVersions,
  getNpmSemverVersion,
  getDefaultRegistry,
  getLatestVersion
};