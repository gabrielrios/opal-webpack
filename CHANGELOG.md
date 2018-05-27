# MASTER:
* Remove unnecessary shell call to get Opal runtime version when using Bundler
* Streamline Opal runtime file fetching
* Fix require_tree cache issue (#35)

# v1.0.7:
* Node style requires (e.g. `require './something'`) are back to not working now since we're using Opal Builder. Once an Opal defect is corrected, both Opal and this loader will have the same behavior as MRI.
* Any files that Opal GEMs stub are now stubbed in the loader when using Bunder, Rails, or additional MRI requires
* Use Opal's Builder class for compilation, which should address several issues (#12, #27)
* Require filename resolution no longer breaks with suffixes that look like extensions (#26)

# v1.0.6:
* Use Rails full asset paths (which will include sprockets and opal-rails dependencies)

# v1.0.5:
* Don't leave cached file in place if Bundler based compiler build fails
* Fix issue with Bundler compilation if run from dependent project

# v1.0.4:
* Fix issue with source maps being 1 line off

# v1.0.3:
* Unstub the `$inject` method on Node to keep the compiler from breaking Karma

# v1.0.2:
* NPM publish error

# v1.0.1:
* Fixed issue with require_tree (#5)

# v1.0.0:
* By default, require 'opal' includes bundled opal in this package, you are discouraged from mixing this compiler with your own runtime
* File caching between runs
* Supports passing stubs in via global options
* Avoid absolute path in opal module names (e.g. `Opal.modules['/root/something']`)
* Make load path more explicit to behave more like Opal does (either load path is current directory and everything must be in there or the load path must be defined)
* Test pure JS require (using similar semantics to Opal)
* require_relative works properly
* require_tree will once opal issues are fixed
* Better test coverage
* Removal Babel compilation (can assume code running under Node has es6 covered)

# Previous project (opalrb-loader)

# v0.1.0
* Upgrade to Opal 0.9.2 [#2](https://github.com/cj/opalrb-loader/issues/2).
* Opal compiler bundled is now minified.

# v0.0.3

* Fix source map bug

# v0.0.2

* Fix "stdlib/native" parsing issue

# v0.0.1

* Initial release
