import { hooks as auth } from 'feathers-authentication';
import { hooks } from 'mostly-feathers-mongoose';
import RuleEntity from '~/entities/rule-entity';
import populateRequires from '../../hooks/populate-requires';
import LRU from 'lru-cache';

const cacheMap = new LRU({ max: 100 });

module.exports = function(options = {}) {
  return {
    before: {
      all: [
        auth.authenticate('jwt'),
        hooks.cache(cacheMap)
      ],
      get: [],
      find: [],
      create: [],
      update: [],
      patch: [],
      remove: [],
    },
    after: {
      all: [
        hooks.cache(cacheMap),
        hooks.populate('achievement.metric', { service: 'sets' }),
        hooks.populate('level.state', { service: 'states' }),
        hooks.populate('level.point', { service: 'points' }),
        hooks.populate('custom.rules.rewards.metric', { service: 'metrics' }),
        populateRequires('*.rules.requires'),
        hooks.presentEntity(RuleEntity, options),
        hooks.responder()
      ]
    }
  };
};