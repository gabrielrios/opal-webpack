require 'corelib/runtime'
# This needs to run right after runtime and no later
require 'compiler_patches/stubs'
# Now we can safely do this
require 'opal'
require 'compiler_patches/disable_warnings'
require 'opal-source-maps'
require 'opal/builder'
require 'opal/builder_processors'
require 'nodejs'
require "pathname"

require 'compiler_patches/source_maps'
require 'compiler_patches/file'
require 'compiler_patches/pathname'
require 'compiler_patches/dir'
require 'compiler_patches/regexp'
require 'compiler_patches/compiler'
require 'compiler_patches/webpack_builder'
require 'compiler_patches/opal'
