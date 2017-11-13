import when from 'when';
import {
  indexOf,
} from 'lodash';
import commander from 'commander';
import { configure } from './lib/config';
import * as scrapper from './lib/scrapper';
import parser from './lib/parser';
import fetcher from './lib/fetcher';
import generator from './lib/generator';

// const tasks = [
//   scrapper.run,
//   parser.run,
//   fetcher.run,
//   generator.run,
// ];

const packagejson = require([process.cwd(), 'package.json'].join('/'));
const PREPROCS = ['sass', 'less'];
const logger = require('./lib/logger');

commander
  .version(packagejson.version)
  .usage('[options] [value]')
  .option('-d, --destination [path]', 'Path for generated files')
  .option('-s, --size [size]', 'The sprite\'s height')
  .option('--preproc [preprocessor type]', 'the css preprocessor type (less, sass etc...)')
  .option('-p, --prefix [prefix]', 'The classnames prefix')
  .option('-c, --cache', 'Force cache use (use last cached html and images) Dont use it if you want last released emojis')
  .parse(process.argv);

const config = configure(commander);
//
// when.all(tasks.map(task => task.call(null, config)))
//   .then(() => {
//
//   })
//   .catch((error) => {
//
//   });

scrapper.run(config);