#!/usr/bin/env node
'use strict';

const commander = require('commander');
const emojisModule = require('../index.js');
const packagejson = require('../package.json');

commander
  .version(packagejson.version)
  .usage('[options] [value]')
  .option('-d, --destination [path]', 'Path for generated files')
  .option('-s, --size [size]', 'The sprite\'s height')
  .option('--preproc [preprocessor type]', 'the css preprocessor type (less, sass etc...)')
  .option('-p, --prefix [prefix]', 'The classnames prefix')
  .option('-c, --cache', 'Force cache use (use last cached html and images) Dont use it if you want last released emojis')
  .parse(process.argv);

if (!commander.preproc) {
  commander.help();
} else {
  emojisModule.run(commander);
}
