'use strict';

const chalk = require('chalk');
const _ = require('lodash');

const loggersTypes = {info: 'yellow', warn: 'orange', success: 'green', error: 'red'};
let loggers = {};

_.each(loggersTypes, (color, type) => {
  loggers[type] = process.env.NODE_ENV === 'test' ? () => {
  } : chalk[color];
});

module.exports = loggers;
