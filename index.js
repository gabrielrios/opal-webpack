'use strict'

const loaderUtils = require('loader-utils')
const path = require('path')

const pkg = require('./package.json')
const cache = require('./lib/fs-cache')
const Opal = require('./lib/opal')
// const opalVersion = Opal.const_get_local('RUBY_ENGINE_VERSION')
const opalVersion = Opal.Kernel.$const_get('RUBY_ENGINE_VERSION')
const transpile = require('./lib/transpile')

function getCurrentLoader(loaderContext) {
  return loaderContext.loaders[loaderContext.loaderIndex]
}

module.exports = function(source) {
  var result = {}

  const filename = this.resourcePath
  const globalOptions = {}
  const loaderOptions = loaderUtils.parseQuery(this.query)
  const userOptions = Object.assign({}, globalOptions, loaderOptions)
  const defaultOptions = {
    sourceRoot: process.cwd(),
    filename: filename,
    file: path.relative(this.context, filename),
    // expire cache when this package or Opal changes
    cacheIdentifier: JSON.stringify({
      'opal-loader': pkg.version,
      'opal-compiler': opalVersion,
      env: process.env.OPAL_ENV || process.env.NODE_ENV
    })
  }
  const options = Object.assign({}, defaultOptions, userOptions)

  if (userOptions.sourceMap === undefined) {
    options.sourceMap = this.sourceMap
  }

  const cacheDirectory = options.cacheDirectory
  const cacheIdentifier = options.cacheIdentifier

  const loaderContext = this

  const transpileInContext = function(source, opt) {
    const currentLoader = getCurrentLoader(loaderContext)
    const compileResult = transpile(source, opt, currentLoader)
    // can't easily know when require_tree file contents have changed
    if (compileResult.requireTrees) {
      // keep Opal specific stuff out of fs-cache.js
      compileResult.doNotCache = true
    }
    else {
      loaderContext.cacheable()
    }
    return compileResult
  }

  if (cacheDirectory) {
    var callback = this.async()
    return cache({
      directory: cacheDirectory,
      identifier: cacheIdentifier,
      source: source,
      options: options,
      transform: transpileInContext
    }, function(err, result) {
      if (err) {
        return callback(err)
      }
      // see above
      if (!result.doNotCache) {
        loaderContext.cacheable()
      }
      return callback(null, result.code, result.map)
    })
  }
  result = transpileInContext(source, options)
  this.callback(null, result.code, result.map)
}
