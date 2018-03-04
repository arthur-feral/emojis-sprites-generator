import jimp from 'jimp';
import fs from 'fs-extra';

process.env.NODE_ENV = 'test';
process.env.TEMP_IMAGES_PATH = `${process.cwd()}/tests/tmp`;
global._ = require('lodash');
global.sinon = require('sinon');
global.chai = require('chai');
global.expect = chai.expect;
global.assert = chai.assert;


const baseConfig = {
  destination: `${process.cwd()}/emojis`,
  size: 48,
  fromCache: false,
  prefix: 'emojis',
  preproc: 'sass',
};

fs.mkdirpSync(`${process.env.TEMP_IMAGES_PATH}/images/`);
fs.mkdirpSync(`${process.env.TEMP_IMAGES_PATH}/html/`);
jimp.read(`${process.cwd()}/res/base.png`).then((image) => {
  image
    .resize(parseInt(baseConfig.size, 10), parseInt(baseConfig.size, 10) + 1)
    .write(BASE_IMAGE_PATH, (imageError) => {
      if (imageError) {
        console.error(imageError);
      }
    });

  fs.unlinkSync(`${imagesPath}/grinning-face.png`);
});