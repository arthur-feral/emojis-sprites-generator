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

module.exports = loggers;
