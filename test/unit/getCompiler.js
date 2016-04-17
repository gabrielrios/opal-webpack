'use strict'
/*jshint expr: true*/

const expect = require('chai').expect
const path = require('path')
const glob = require('glob')

const cleanScopeAndRequire = require('../support/cleanScopeAndRequire')
const execSync = require('child_process').execSync

describe('compiler', function(){
  beforeEach(cleanScopeAndRequire)

  function getCompiler(source, targetOptions) {
    return require('../../lib/getCompiler')(source, targetOptions)
  }

  function doCompile(relativeFileName, source, options) {
    const targetOptions = {
      relativeFileName: relativeFileName
    }
    Object.assign(targetOptions, options)
    const compiler = getCompiler(source, targetOptions)
    compiler.$compile()
    return compiler.$result()
  }

  function cleanBundlerCompilers() {
    execSync(`rm -rf ${path.resolve(__dirname, '../../vendor/opal-compiler-v*.js')}`)
  }

  it('loads an Opal compiler from a configurable file', function() {
    process.env.OPAL_COMPILER_PATH = path.resolve(__dirname, '../support/tweakedOpalCompiler.js')

    const result = doCompile('foo', 'puts "Howdy #{1+2}"')
    expect(result).to.include('0.10.0.beta2.webpacktest')
  })

  it('does not prevent Karma from working', function() {
    // karma needs $inject to work
    const func = function() {}
    doCompile('foo', 'puts "Howdy #{1+2}"')
    expect(func).to.not.have.property('$inject')
  })

  it('can fetch an Opal compiler from Bundler', function() {
    this.timeout(12000)

    process.env.OPAL_USE_BUNDLER = 'true'

    const result = doCompile('foo', 'puts "Howdy #{1+2}"')
    if (execSync('opal -v').toString().trim().indexOf('0.9') != -1) {
      expect(result).to.include('Generated by Opal 0.9.2')
    }
    else{
      expect(result).to.include('Generated by Opal 0.10.0.beta2')
    }
  })

  it('allows a single additional require for Bundler compiler', function() {
    this.timeout(20000)

    // need to override for this test
    cleanBundlerCompilers()

    const env = process.env
    env.OPAL_USE_BUNDLER = 'true'
    env.OPAL_COMPILER_REQUIRES = 'test/fixtures/compiler_override'
    env.OPAL_COMPILER_LOAD_PATH = '.'

    try {
      const result = doCompile('foo', 'puts "Howdy #{1+2}"')
      expect(result).to.include('Generated by Opal 0.2222.foobar')
    }
    finally {
      // we will have customized this, don't want to break other tests
      cleanBundlerCompilers()
    }
  })

  it('allows an additional require for Bundler and does not mess up Karma', function() {
    this.timeout(20000)

    // need to override for this test
    cleanBundlerCompilers()
    const func = function() {}

    const env = process.env
    env.OPAL_USE_BUNDLER = 'true'
    env.OPAL_COMPILER_REQUIRES = 'test/fixtures/compiler_override'
    env.OPAL_COMPILER_LOAD_PATH = '.'

    try {
      doCompile('foo', 'puts "Howdy #{1+2}"')
      expect(func).to.not.have.property('$inject')
    }
    finally {
      // we will have customized this, don't want to break other tests
      cleanBundlerCompilers()
    }
  })

  it('does not leave dangling file if additional Bundler require fails', function(done) {
    this.timeout(20000)

    // need to override for this test
    cleanBundlerCompilers()

    const env = process.env
    env.OPAL_USE_BUNDLER = 'true'
    env.OPAL_COMPILER_REQUIRES = 'test/fixtures/non_existent_file'
    env.OPAL_COMPILER_LOAD_PATH = '.'

    expect(function() { doCompile('foo', 'puts "Howdy #{1+2}"') }).to.throw(Error)
    glob(path.resolve(__dirname, '../../vendor/opal-compiler-v*.js'), function(err, files) {
      expect(files).to.be.empty
      done()
    })
  })

  it('allows a multiple additional requires for Bundler compiler', function() {
    this.timeout(20000)

    // need to override for this test
    cleanBundlerCompilers()

    const env = process.env
    env.OPAL_USE_BUNDLER = 'true'
    env.OPAL_COMPILER_REQUIRES = 'test/fixtures/compiler_override.rb:test/fixtures/compiler_override_2'
    env.OPAL_COMPILER_LOAD_PATH = '.'

    try {
      const result = doCompile('foo', 'puts "Howdy #{1+2}"')
      expect(result).to.include('Generated by Opal 0.2222.foobar')
      expect(result).to.include('/* test */')
    }
    finally {
      // we will have customized this, don't want to break other tests
      cleanBundlerCompilers()
    }
  })

  it('raw compiler works', function(){
    var result = doCompile('foo', 'puts "Howdy #{1+2}"')

    expect(result).to.include('self.$puts("Howdy " + ($rb_plus(1, 2)))')
  })

  it('handles syntax errors', function(done) {
    const opal09 = execSync('opal -v').toString().trim().indexOf('0.9') != -1
    // was having problems with chai expect throw assertions
    let error = null
    try {
      doCompile('foo', 'def problem')
    }
    catch (e) {
      error = e
    }
    if (error) {
      if (opal09 && error.name === 'SyntaxError' && /An error occurred while compiling: foo[\S\s]*false/.test(error.message)) {
        return done()
      }
      else if (error.name === 'RuntimeError' && /An error occurred while compiling: foo[\S\s]+Source: foo:1:11/.test(error.message)) {
        return done()
      }
      else {
        return done(new Error(`Unexpected error ${error}`))
      }
    }
    return done(new Error('expected error, got none'))
  })

  it('passes on compiler options', function() {
    var result = doCompile('foo', 'def abc(hi); end;', {arity_check: true})

    expect(result).to.include('Opal.ac')
  })

  it('does not erase filename from options since follow on code in transpile needs it', function() {
    var options = {
      filename: '/stuff/junk.rb',
      relativeFileName: 'junk.rb'
    }
    getCompiler('HELLO=123', options)

    expect(options.filename).to.eq('/stuff/junk.rb')
  })

  describe('Opal module declarations', function () {
    function doModuleCompile(filename) {
      return doCompile(filename, 'HELLO=123', {
        requirable: true,
        file: filename
      })
    }

    it('standard', function() {
      var result = doModuleCompile('dependency')

      expect(result).to.include('Opal.modules["dependency"]')
    })

    it('allows file directive from parent file/path to override', function() {
      var result = doCompile('foo/dependency', 'HELLO=123', {
        requirable: true,
        file: 'dependency'
      })

      expect(result).to.include('Opal.modules["dependency"]')
    })

    it('require_relative', function() {
      var result = doModuleCompile('dependency/foo')

      expect(result).to.match(/Opal.modules\["dependency\/foo"\]/)
    })

    it('require tree', function() {
      var result = doModuleCompile('dependency/foo.rb')

      expect(result).to.match(/Opal.modules\["dependency\/foo"\]/)
    })

    it('node conventions', function() {
      var result = doModuleCompile('./dependency')

      expect(result).to.include('Opal.modules["./dependency"]')
    })
  })

  describe('Opal requires', function() {
    function doRequireCompile(statement) {
      return doCompile('foo.rb', statement, {
        stubs: ['a_file']
      })
    }

    it('node conventions', function () {
      var result = doRequireCompile('require "./a_file"')

      expect(result).to.include('self.$require("./a_file")')
    })

    it('standard require', function () {
      var result = doRequireCompile('require "a_file"')

      expect(result).to.include('self.$require("a_file")')
    })

    it('require relative', function () {
      var result = doRequireCompile('require_relative "a_file"')

      expect(result).to.include('self.$require("foo"+ \'/../\' + "a_file")')
    })

    it('require tree', function() {
      var result = doRequireCompile('require_tree "a_file"')

      expect(result).to.include('self.$require_tree("a_file")')
    })

    it('require tree with dot', function() {
      var result = doRequireCompile('require_tree "./a_file"')

      expect(result).to.include('self.$require_tree("a_file")')
    })

    it('require tree with path', function() {
      var result = doRequireCompile('require_tree "path/a_file"')

      expect(result).to.include('self.$require_tree("path/a_file")')
    })

    it('require relative with leading dot', function () {
      var result = doRequireCompile('require_relative "./a_file"')

      expect(result).to.include('self.$require("foo"+ \'/../\' + "./a_file")')
    })
  })
})
