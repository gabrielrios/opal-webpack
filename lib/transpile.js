'use strict'

const resolveFilename         = require('./resolveFilename')
const processSourceMaps       = require('./processSourceMaps')
const getCompiler             = require('./getCompiler')
const getStub                 = require('./getStub')
const getWebpackRequire       = require('./getWebpackRequire')
const getJsRequire            = require('./getJsRequire')
const runtimeFilename         = require('./getOpalRuntimeFilename')
const opalRequiresForStubbing = require('./getOpalRequiresForStubbing')
const useBundler              = require('./bundlerCheck')()
const rubyMetadata            = require('./getRubyMetadata')

function withoutLeadingRelative (filename) {
  const relativePath = /\.\/(.*)/.exec(filename)
  return relativePath ? relativePath[1] : filename
}

function getStubFilename(stubs, filename) {
  const relativePath = withoutLeadingRelative(filename)
  return stubs.indexOf(relativePath) != -1 ? relativePath : null
}

function getGeneratedSource(prepends) {
  return prepends.join(' ') + '\n'
}

function isBundledOpal(filename) {
  return filename === runtimeFilename
}

module.exports = function (source, options, context) {
  /*
    Workaround to make IO work,
    webpack polyfill global "process" module by default,
    while Opal::IO rely on it to deterimine in node environment or not
  */
  let prepend = ['process = undefined;']

  // bundled opal is already JS but will still be vulnerable to the process/webpack issue
  if (isBundledOpal(options.filename)) {
    return {
      code: getGeneratedSource(prepend) + source
    }
  }
  const compiler = getCompiler(source, options)

  const result = compiler.$to_s()
  const stubs = (options.stubs || []).concat(rubyMetadata.stubs)

  const addRequires = files => {
    files.forEach(filename => {
      var stubFilename = stubs && getStubFilename(stubs, filename)
      var absolutePath = stubFilename ? null : resolveFilename(compiler, filename)
      var requireIsBundledOpal = absolutePath && !useBundler ? (opalRequiresForStubbing.indexOf(filename) != -1) : false
      // bundled opal needs to route through webpack requires so we can deal with the webpack/process issue (see above)
      if (absolutePath && !requireIsBundledOpal && absolutePath.match(/\.js$/)) {
        prepend = prepend.concat(getJsRequire(filename, absolutePath))
      }
      else if (!options.externalOpal || opalRequiresForStubbing.indexOf(filename) == -1) {
        var statement = stubFilename ? getStub(stubFilename) : getWebpackRequire(context, options, filename, absolutePath)
        prepend.push(statement)
      }
    })
  }

  addRequires(compiler.$requires())

  const generatedCode = getGeneratedSource(prepend)
  const response = {
    code: generatedCode + result,
    requireTrees: compiler['$require_trees?']()
  }
  if (options.sourceMap) {
    response.map = processSourceMaps(compiler, source, options.filename, result, generatedCode)
  }
  return response
}
