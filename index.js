if (!global._babelPolyfill) { require('babel-polyfill'); }

module.exports = require('./lib/index');
module.exports.entities = require('./lib/entities');
module.exports.hooks = require('./lib/hooks');
module.exports.helpers = require('./lib/helpers');
module.exports.models = require('./lib/models');
