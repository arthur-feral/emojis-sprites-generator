import fs from 'fs-extra';
import os from 'os';
import commander from 'commander';
import { configure } from './lib/config';
import Parser from './lib/parser/parser';
import Fetcher from './lib/fetcher/fetcher';
import Collector from './lib/collector/collector';
import Generator from './lib/generator/generator';
import EventEmitter from 'eventemitter3';
import {
  APP_START, ERROR,
} from './lib/constants';
import logger from './lib/logger';
import jimp from 'jimp';

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
const fetcher = Fetcher(config, emitter);
const parser = Parser(config, emitter);
const collector = Collector(config, emitter);
const generator = Generator(config, emitter);
const imagesPath = `${tempPath}/images`;
const BASE_IMAGE_PATH = `${imagesPath}/base.png`;

logger.info(`-- Preparing files ${tempPath}`);
fs.mkdirpSync(`${tempPath}/images/`);
fs.mkdirpSync(`${tempPath}/html/`);
jimp.read(`${process.cwd()}/res/base.png`).then((image) => {
  image
    .resize(parseInt(config.size, 10), parseInt(config.size, 10) + 1)
    .write(BASE_IMAGE_PATH, (imageError) => {
      if (imageError) {
        emitter.emit(ERROR, imageError);
      }

      logger.success('-- Done.');
      logger.info('-- Fetching data');
      emitter.emit(APP_START);
      logger.success('\n');
      logger.success('-- Done.');
    });
}).catch((readError) => {
  emitter.emit(ERROR, readError);
});


