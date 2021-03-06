#!/usr/bin/env node
'use strict';

const _ = require('lodash');
const commander = require('commander');
const emojisModule = require('../index.js');
const packagejson = require('../package.json');
const PREPROCS = ['sass', 'less'];
const logger = require('../lib/logger');

commander
  .version(packagejson.version)
  .usage('[options] [value]')
  .option('-d, --destination [path]', 'Path for generated files')
  .option('-s, --size [size]', 'The sprite\'s height')
  .option('--preproc [preprocessor type]', 'the css preprocessor type (less, sass etc...)')
  .option('-p, --prefix [prefix]', 'The classnames prefix')
  .option('-c, --cache', 'Force cache use (use last cached html and images) Dont use it if you want last released emojis')
  .parse(process.argv);

if (!commander.preproc || _.indexOf(PREPROCS, commander.preproc) === -1) {
  logger.error(`Only ${PREPROCS} css preprocessors are supported`);
  commander.help();
} else {
  emojisModule.run(commander);
}
