import jimp from 'jimp';
import fs from 'fs-extra';

process.env.NODE_ENV = 'test';
process.env.TEMP_FILES_PATH = `${process.cwd()}/tests/tmp`;
global._ = require('lodash');
global.sinon = require('sinon');
global.chai = require('chai');
global.expect = chai.expect;
global.assert = chai.assert;


const baseConfig = {
  destination: `${process.env.TEMP_FILES_PATH}/emojis`,
  size: 48,
  fromCache: false,
  prefix: 'emojis',
  preproc: 'sass',
};

fs.mkdirpSync(`${process.env.TEMP_FILES_PATH}/emojis/`);
fs.mkdirpSync(`${process.env.TEMP_FILES_PATH}/images/`);
fs.mkdirpSync(`${process.env.TEMP_FILES_PATH}/html/`);
fs.mkdirpSync(`${process.env.TEMP_FILES_PATH}/styles/`);
jimp.read(`${process.cwd()}/res/base.png`).then((image) => {
  image
    .resize(parseInt(baseConfig.size, 10), parseInt(baseConfig.size, 10))
    .write(`${process.env.TEMP_FILES_PATH}/images/base.png`, (imageError) => {
      if (imageError) {
        console.error(imageError);
      }
    });
});