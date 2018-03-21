import glob from 'glob';
import path from 'path';
import { rate, limit } from './rate.schema';
import { requires } from './requires.schema';
import { reward } from './reward.schema';
import { variable } from './variable.schema';


// load all models
let modelFiles = glob.sync(path.join(__dirname, './*.model.js'));
modelFiles.forEach(file => {
  let name = path.basename(file, '.model.js');
  module.exports[name] = require(file);
});

module.exports.rate = { schema: rate };
module.exports.limit = { schema: limit };
module.exports.requires = { schema: requires };
module.exports.rewards = { schema: [reward] };
module.exports.variables = { schema: [variable] };