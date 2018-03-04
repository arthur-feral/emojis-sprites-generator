require('dotenv').config();
import os from 'os';
import commander from 'commander';
import superagent from 'superagent';
import { configure } from './lib/config/config';
import Parser from './lib/parser/parser';
import Fetcher from './lib/fetcher/fetcher';
import Monitor from './lib/monitor/monitor';
import Collector from './lib/collector/collector';
import Generator from './lib/generator/generator';
import EventEmitter from 'eventemitter3';
import {
  APP_START, ERROR,
} from './lib/constants';
import logger from './lib/logger';
import jimp from 'jimp';

//process.env.TEMP_IMAGES_PATH = os.tmpdir();
const emitter = new EventEmitter();

const packagejson = require(`${process.cwd()}/package.json`);

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
const fetcher = Fetcher(superagent, config, emitter);
const parser = Parser(config, emitter);
const monitor = Monitor(config, emitter);
const collector = Collector(config, emitter);
const generator = Generator(config, emitter);

console.log(process.env.TEMP_IMAGES_PATH);

//emitter.emit(APP_START);

process.stdout.on('error', () => {
  process.exit(1);
});
