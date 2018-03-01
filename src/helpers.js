import assert from 'assert';
import dateFn from 'date-fns';
import fp from 'mostly-func';

export const evalFormulaValue = (value, variables = []) => {
  // TODO evaluate value formula
  return parseInt(value);
};

const fulfillMetric = (user, variables, cond) => {
  const userMetric = fp.find(fp.propEq('metric', cond.metric.id || cond.metric), user.scores || []);
  switch (cond.type) {
    case 'point':
    case 'set':
    case 'compound': {
      const userValue = (cond.type === 'set')
        ? userMetric && userMetric.value[cond.item] || 0
        : userMetric && userMetric.value || 0;
      const condValue = evalFormulaValue(cond.value);
      switch (cond.operator) {
        case 'eq': return userValue === condValue;
        case 'ne': return userValue !== condValue;
        case 'gt': return userValue > condValue;
        case 'gte': return userValue >= condValue;
        case 'lt': return userValue < condValue;
        case 'lte': return userValue <= condValue;
        default:
          console.warn(`fulfill ${cond.type} metric operator not supported: '${cond.operator}'`);
          return false;
      }
    }
    case 'state': {
      const userValue = userMetric? userMetric.value : null;
      const condValue = cond.value;
      switch (cond.operator) {
        case 'eq': return userValue === condValue;
        case 'ne': return userValue !== condValue;
        default:
          console.warn('fulfill state metric operator not supported', cond.operator);
          return false;
      }
    }
  }
  return true;
};

const fulfillAction = (user, variables, cond) => {
  const userAction = fp.find(fp.propEq('action', cond.action.id || cond.action), user.actions || []);
  const userValue = userAction && userAction.count || 0;
  const condValue = evalFormulaValue(cond.value);
  switch (cond.operator) {
    case 'eq': return userValue === condValue;
    case 'ne': return userValue !== condValue;
    case 'gt': return userValue > condValue;
    case 'gte': return userValue >= condValue;
    case 'lt': return userValue < condValue;
    case 'lte': return userValue <= condValue;
    default:
      console.warn(`fulfill ${cond.type} metric operator not supported: '${cond.operator}'`);
      return false;
  }
};

const fulfillTeam = (user, variables, cond) => {
  return true;
};

const operator = (op, lhs, rhs) => {
  switch (op) {
    case 'eq': return lhs === rhs;
    case 'ne': return lhs !== rhs;
    case 'gt': return lhs > rhs;
    case 'gte': return lhs >= rhs;
    case 'lt': return lhs < rhs;
    case 'lte': return lhs <= rhs;
    default:
      console.warn(`operator not supported: '${op}'`);
      return false;
  }
};

const fulfillTime = (user, variables, cond) => {
  const condValue = evalFormulaValue(cond.value);
  const now = new Date();
  switch (cond.unit) {
    case 'hour_of_day': return operator(cond.operator, dateFn.getHours(now), condValue);
    case 'day_of_week': return operator(cond.operator, dateFn.getISODay(now), condValue);
    case 'day_of_month': return operator(cond.operator, dateFn.getDate(now), condValue);
    case 'day_of_year': return operator(cond.operator, dateFn.getDayOfYear(now), condValue);
    case 'week_of_year': return operator(cond.operator, dateFn.getISOWeek(now), condValue);
    case 'month_of_year': return operator(cond.operator, dateFn.getMonth(now), condValue);
  }
  return true;
};

const fulfillFormula = (user, variables, cond) => {
  return true;
};

export const fulfillRequires = fp.curry((user, variables, cond) => {
  if (cond && cond.rule) {
    switch (cond.rule) {
      case 'metric': return fulfillMetric(user, variables, cond);
      case 'action': return fulfillAction(user, variables, cond);
      case 'team': return fulfillTeam(user, variables, cond);
      case 'time': return fulfillTime(user, variables, cond);
      case 'formula': return fulfillFormula(user, variables, cond);
      case 'and': return cond.conditions && fp.all(fulfillRequires(user, variables), cond.conditions);
      case 'or': return cond.conditions && fp.any(fulfillRequires(user, variables), cond.conditions);
      default: console.warn('fulfillRequires condition rule not supported', cond.rule);
    }
  }
  return true;
});

export const fulfillAchievementRewards = (achievement, variables, user) => {
  return fp.reduce((arr, rule) => {
    if (rule.item && rule.item.name && rule.item.number) {
      if (fulfillRequires(user, variables, rule.requires)) {
        const reward = {
          metric: achievement.metric,
          item: rule.item.name,
          verb: 'add',
          value: rule.item.number
        };
        return fp.concat(arr, [reward]);
      }
    } else {
      console.warn('process achievement rule skipped:', rule);
    }
    return arr;
  }, [], achievement.rules || []);
};

export const fulfillLevelRewards = (level, user) => {
  const currentState = fp.find(fp.propEq('metric', level.state.id), user.scores || []);
  const currentPoint = fp.find(fp.propEq('metric', level.point.id), user.scores || []);
  if (level.levels && currentPoint && currentPoint.value > 0) {
    for (let i = 0; i < level.levels.length; i++) {
      if (currentPoint.value < level.levels[i].threshold) {
        const reward = {
          metric: level.state,
          verb: 'set',
          value: level.levels[i].rank
        };
        return [reward];
      }
    }
  }
  return [];
};

export const fulfillCustomRewards = (rules, variables, user) => {
  // filter by the rule requirements
  const activeRules = fp.filter(rule => {
    return fp.all(fulfillRequires(user, variables), rule.requires);
  }, rules);
  return fp.flatten(fp.map(fp.prop('rewards'), activeRules));
};