'use strict';

module.exports = (logger) => {
  const imageGenerator = require('./imageGenerator')(logger);

  return imageGenerator
};
