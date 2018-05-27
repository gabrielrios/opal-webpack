'use strict'

const Opal = require('./opal')

module.exports = Opal.Kernel.$const_get('RUBY_ENGINE_VERSION')
