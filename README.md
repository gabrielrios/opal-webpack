# opal-webpack
> Opal is a compiler for writing JavaScript in Ruby.

This package allows transpiling Ruby files using [Opal](http://opalrb.org) and [webpack](https://github.com/webpack/webpack). It does so using a bootstrapped copy of the Opal compiler, which means your Opal files can be compiled directly from a Node process running webpack.

Check out [this blog post](https://medium.com/@zetachang/from-sprockets-to-webpack-5f3d1afbd1b0) if you are interested in the project background.

[![npm version](https://img.shields.io/npm/v/opal-webpack.svg?style=flat-square)](https://www.npmjs.com/package/opal-webpack)
[![npm downloads](https://img.shields.io/npm/dt/opal-webpack.svg?style=flat-square)](https://www.npmjs.com/package/opal-webpack)
[![Quality](http://img.shields.io/codeclimate/github/cj/opal-webpack.svg?style=flat-square)](https://codeclimate.com/github/cj/opal-webpack)
[![Build Status](http://img.shields.io/travis/cj/opal-webpack/master.svg?style=flat)](http://travis-ci.org/cj/opal-webpack)
[![Join the chat at https://gitter.im/cj/opal-webpack](https://badges.gitter.im/cj/opal-webpack.svg)](https://gitter.im/cj/opal-webpack?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Installation

```bash
npm install opal-webpack --save-dev
```
## Requirements

* Node/Webpack obviously
* Opal 0.9.2 or 0.10 (see below for information on this)

## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

```javascript
// webpack.config.js
module: {
  loaders: [
    {
      test: /\.rb?$/,
      loader: 'opalrb-loader'
    }
  ]
}
```

This is all you need to get started with a basic setup. No installation of Opal or Ruby is required. See below for more information.

### Options

See `Opal::Compiler` [options](https://github.com/opal/opal/blob/master/lib/opal/compiler.rb) for possible options.

Query options (see webpack docs) will apply to specific loader configs (each 'test', loader, etc.).

```javascript
// webpack.config.js
module: {
  loaders: [
    {
      test: /\.rb?$/,
      loader: 'opalrb-loader',
      query: {
        requirable: false,
        freezing: false,
      }
    }
  ]
}
```

You can also supply global options that apply to any Opal loaded file, not just a single 'test':

```javascript
// webpack.config.js
module: {
  loaders: [
    {
      test: /\.rb?$/,
      loader: 'opalrb-loader',
    }
  ],
  opal: {
    requirable: false,
    freezing: false,
  }
}
```

### Requires

With your Ruby/Opal `require` statements, you should use the Sprockets/Ruby/Opal convention (not the node convention of `require './something'`, at least until [this issue](https://github.com/cj/opal-webpack/issues/17) is dealt with). `require_relative` can be used if you want to require something relative to the current file.

If you want to use a Node based asset within Opal, you'll have to do this:

```ruby
`var leftpad = require('left-pad')`

result = `leftpad('foo', 5)`

puts result
```

Since Ruby require does not return a value for the module the way that node requires do, this is the only way you can get
a reference to the module.

NOTE: If you use `require_tree`, the file containing the statement will not be cached by either the persistent cache with this loader OR with webpack's in memory cache. This ensures that additional files, in watch mode, will be picked up by Webpack. You can mitigate the performance impact of this by not including much logic in files with `require_tree` besides the `require_tree` statements.

### Load path

Currently, the loader does not use webpack's `moduleDirectories` for finding assets that you `require` in Opal. See [this issue](https://github.com/cj/opal-webpack/issues/7).

By default, if you run webpack in a Bundler context (e.g. `bundle exec webpack...`), the loader will issue a `Bundler.require` call and add all the load paths that any Opal GEMS use to the webpack load path. If you use Rails, set the `RAILS_ENV` environment variable before running webpack and the loader will start up that Rails environment and grab Sprockets load paths (including paths that tools like opal-rails have added).

If you don't use Bundler or wish to supply additional MRI requires, set the `OPAL_MRI_REQUIRES` environment variable to a colon separated list of Ruby `require` clauses. E.g. `OPAL_MRI_REQUIRES=opal-browser:opal-builder`

You can also pass the `OPAL_LOAD_PATH` environment variable to webpack with additional colon separated paths.

### Stubs

To tell the Opal compiler to stub out certain dependencies, do this

```js
{
  module: {
    loaders: [
      {
        test: /\.rb?$/,
        loader: 'opalrb-loader'
      }
    ]
  },
  opal: {
    stubs: ['dependency']
  }
}
```

The loader will also pull in any stubbed files from Opal GEMs automatically when:
* the `OPAL_MRI_REQUIRES` environment variable is set
* webpack is run in a Bundler context
* webpack is run with the RAILS_ENV environment variable set

### Caching

Just like the Babel loader, you can cache compilation results on the filesystem to improve load times
between invocations of webpack.

```js
{
  module: {
    loaders: [
      {
        test: /\.rb?$/,
        loader: 'opalrb-loader'
      }
    ]
  },
  opal: {
    cacheDirectory: './tmp/cache'
  }
}
```

### Opal version

By default, When you `require 'opal'` in any asset, this loader will use the version of Opal bundled with this tool (0.10 master from Git as of this writing). This is meant to get you started but not meant to cover all use cases (for example, opal/mini, opal/full are not supported).

Here are the options you have for choosing which compiler/runtime you wish to use:

1. Default (Runtime and compiler provided with this package): Opal is included in the webpack bundle as soon as you do a `require 'opal'` in your code.
2. Opal compiler provided by `Gemfile`: Opal runtime files are included in your bundle on a granular basis when you do `require 'opal'`.
3. Opal loaded externally outside of webpack.
4. A compiler+runtime you provide the location to: Opal is also included in the bundle the same way as #1.

Here are some details about options 2-4:

#### Opal compiler provided by `Gemfile`

**When to use it:** You use Opal with a server side Ruby application and want to have granular includes (e.g. `opal/mini`) of Opal when your assets are served to browsers (size).

**How:** set the `OPAL_USE_BUNDLER` environment variable to true.

#### Opal loaded externally outside of webpack

**When to use it:** You have a unit test setup like opal-rspec with some big assets that are not being tested/changing with your application and want a quick feedback cycle.

**How:** You can mix and match this option with the others. One common way would be to:

1. Set the `OPAL_USE_BUNDLER` environment variable to true to load the compiler that way.
2. Build an opal distribution and include that in the browser/testing tool separately from Webpack.
3. Set your webpack config as follows:
```js
{
  module: {
    loaders: [
      {
        test: /\.rb?$/,
        loader: 'opalrb-loader'
      }
    ]
  },
  opal: {
    externalOpal: true
  }
}
```

Then you'll have assets compiled with the version of Opal that you have in your `Gemfile` and webpack can focus on leaner assets that don't change. `externalOpal` basically is equivalent to stubbing `['opal', 'opal/mini', 'opal/full']`. That way any `require 'opal'` statements in your code will not cause the full Opal library to be included in your bundle.

#### A compiler+runtime you provide the location to

**When to use it:** You like the default setup of this tool but want to hack around and use a different compiler. Not a common use case.

**How:** set the `OPAL_COMPILER_PATH` environment variable to the compiled asset and `OPAL_RUNTIME_PATH` to the file you want to be bundled for browsers when one of your assets does a `require 'opal'`. You'll need to ensure it can do bootstrap compilation (see the `package.json` file for how we build ours).

### Code Splitting

The code splitting feature of Webpack has not been extensively tested with opal `require` statements. What's for certain is that you cannot define vendor entry points for load path loaded files unless you use an absolute path. Example:

```js
module.exports = {
  output: {
    filename: 'bundle.js'
  },
  entry: {
    app: './spec/javascripts/entry_point.js',
    vendor: ['/Users/joe/.rbenv/versions/2.2.4/lib/ruby/gems/2.2.0/gems/react-rails-1.6.2.opal1/lib/assets/react-source/development-with-addons/react-server.js']
  },
  module: {
    loaders: [
      {
        test: /\.rb$/,
        loader: 'opal-webpack'
      }
  }
}  
```

## Known issues/limitations
* This loader uses a bootstrapped Opal compiler. This means that a compiled version of the compiler is compiling your code. There may some issues (like [this one](https://github.com/opal/opal/pull/1422)) that are still being addressed in Opal that affect the compiler.
* First time compiling is relatively slow compared to Ruby one, use `--watch` option for webpack to speed up dev iteration or use the cache option which will cache compiled assets to the filesystem.
* Code splitting on Opal requires has not been fully tested.
* erb is not supported (which should be implemented as separate loader).

## Examples

It's under [Examples](https://github.com/cj/opal-webpack/tree/master/examples) folder.

* simple: Basic setup without further dependency.
* complex: Compile opal/corelib and other gems.

## Development

* `npm install`
* `npm run build_compiler` to build compiler
* `npm start` to compile & watch `index.js`

## Contact

[CJ Lazell](http://github.com/cj)
[@ceej](https://twitter.com/cj)
Brady Wied

## License

Available under the MIT license. See the LICENSE file for more info.
