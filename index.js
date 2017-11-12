import when from 'when';
import {
  indexOf,
} from 'lodash';
import commander from 'commander';
import config from './lib/config';
import crawler from './lib/crawler';
import parser from './lib/parser';
import fetcher from './lib/fetcher';
import generator from './lib/generator';

const tasks = [
  crawler.run,
  parser.run,
  fetcher.run,
  generator.run,
];

const packagejson = require('./package.json');
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

if (!commander.preproc || indexOf(PREPROCS, commander.preproc) === -1) {
  logger.error(`Only ${PREPROCS} css preprocessors are supported`);
  commander.help();

  return;
}


when.all(tasks.map(task => task.call(null, commander)))
  .then(() => {

  })
  .catch((error) => {

  });