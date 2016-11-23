'use strict';

const _ = require('lodash');

/**
 * format correctly categories object created by scapper
 * @param datas
 * @returns {*}
 */
const reduceDatas = (datas) => {
  return _.reduce(datas, function(result, value) {
    result = _.merge(result, value);

    return result;
  }, {});
};

module.exports = {
  reduceDatas
};
