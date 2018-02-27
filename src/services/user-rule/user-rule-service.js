import assert from 'assert';
import makeDebug from 'debug';
import { Service as BaseService } from 'mostly-feathers';
import fp from 'mostly-func';
import defaultHooks from './user-rule-hooks';

const debug = makeDebug('playing:user-rules-services:user-rules');

const defaultOptions = {
  name: 'user-rules'
};

class UserRuleService extends BaseService {
  constructor(options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup(app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  /**
   * process action only
   */
  get(id, params) {
    if (id === 'process') {
      return this._process(id, null, params);
    } else {
      return null;
    }
  }

  /**
   * rules process for current player
   */
  _process(id, data, params) {
    params = params || { query: {} };
    assert(params.user, 'params.user not provided');

    const svcRules = this.app.service('rules');
    // get available rules
    const getRules = () => svcRules.find({
      query: { $select: [
        'achievement.rules.rewards.metric',
        'custom.rules.rewards.metric', '*'
      ]},
      paginate: false
    });

    return getRules().then(results => {
      return results;
    });
  }
}

export default function init(app, options, hooks) {
  return new UserRuleService(options);
}

init.Service = UserRuleService;
