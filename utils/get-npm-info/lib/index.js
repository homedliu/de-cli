'use strict'

const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver')

function getNpmInfo(npmName, registry) {
  if (!npmName) {
    return null
  }
  const registryUrl = registry || getDefaultRegistry()
  const npmInfoUrl=urlJoin(registryUrl,npmName)
  return axios.get(npmInfoUrl).then(res=>{
      if(res.status===200){
        return res.data
      }
      return null
  }).catch(err=>{
      return 
  })
}

function getDefaultRegistry(isOriginal = false) {
  return isOriginal
    ? 'https://registry.npmjs.org'
    : 'https://registry.npm.taobao.org'
}

async function getNpmSemverVersion(baseVersion, npmName, registry) {}

function getNpmVersions() {}

module.exports = {
  getNpmInfo,
  getNpmSemverVersion,
}
