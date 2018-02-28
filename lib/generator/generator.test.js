import {
  size,
} from 'lodash';
import fs from 'fs';
import EventEmitter from 'eventemitter3';
import GeneratorFactory from './generator';

const baseConfig = {
  destination: `${process.cwd()}/emojis`,
  size: 24,
  fromCache: false,
  prefix: 'emojis',
  preproc: 'sass',
};

const emitter = new EventEmitter();
let generator = GeneratorFactory(baseConfig, emitter);

const parseImageSuccessSpy = sinon.spy();

emitter.on('PARSER_PARSE_IMAGE_SUCCESS', parseImageSuccessSpy);

//const emojiWithModifiers = fs.readFileSync(`${__dirname}/fixtures/emojiWithModifiers.html`, 'utf8');

describe('Generator', () => {

});