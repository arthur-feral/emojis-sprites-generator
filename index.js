import {
  indexOf,
} from 'lodash';
import commander from 'commander';
import { configure } from './lib/config';
import Parser from './lib/parser/parser';
import Fetcher from './lib/fetcher/fetcher';
import Collector from './lib/collector/collector';
import EventEmitter from 'eventemitter3';
import {
  APP_START,
} from './lib/constants';

const emitter = new EventEmitter();

const packagejson = require([process.cwd(), 'package.json'].join('/'));
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

const fetcher = Fetcher(config, emitter);
const parser = Parser(config, emitter);
const collector = Collector(config, emitter);

emitter.emit(APP_START);