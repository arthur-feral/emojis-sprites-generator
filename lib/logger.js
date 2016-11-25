'use strict';

const chalk = require('chalk');
const _ = require('lodash');

const loggersTypes = {info: 'yellow', warn: 'magenta', success: 'green', error: 'red'};
let loggers = {};

_.each(loggersTypes, (color, type) => {
  loggers[type] = process.env.NODE_ENV === 'test' ? () => {
  } : (message) => {
    console.log(`${chalk[color](message)}`);
  };
});

loggers.count = function(message) {
  process.stdout.write(`${chalk.yellow(message)}\r`);
};

/**
 * module for stdout logs
 * it exposes info, warn, error and success methods to log with special color
 * it exposes count method to log some progressing infos
 * @type {{}}
 */
module.exports = loggers;
