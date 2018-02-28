import fs from 'fs-extra';
import os from 'os';
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
import logger from './lib/logger';

const emitter = new EventEmitter();

const packagejson = require(`${process.cwd()}/package.json`);
const tempPath = `${process.cwd()}/tmp`;
// const tempPath = os.tmpdir();

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

logger.info(`-- creating files space in ${tempPath}`);
try {
  fs.accessSync(`${tempPath}/images/`, fs.F_OK);
} catch (error) {
  fs.mkdirpSync(`${tempPath}/images/`);
}
logger.info('-- Done.');

const fetcher = Fetcher(config, emitter);
const parser = Parser(config, emitter);
const collector = Collector(config, emitter);

emitter.emit(APP_START);