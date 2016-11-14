'use strict';

const _ = require('lodash');
const fs = require('fs');
const gm = require('gm');
const when = require('when');

/**
 * concat images contained into sourcePath to an unique sprite image
 * @param {string} sourcePath folder containing all sources images
 * @param {string} destPath folder where the result sprite will be writen
 * @param {int} size (optional) an height in pixel the sprite should have
 * @returns {Promise}
 */
let emojisSpriteGenerator = (sourcePath, destPath, size) => {
  const filesPaths = fs.readdirSync(sourcePath);
  let result = null;

  return when.promise((resolve, reject) => {
    if (filesPaths.length) {
      try {
        _.each(filesPaths, (filePath) => {
          let fileFullPath = `${sourcePath}/${filePath}`.split('/').filter((tempPath) => tempPath.length).join('/');
          fileFullPath = `/${fileFullPath}`;
          if (!result) {
            result = gm(fileFullPath);
          } else {
            result.append(fileFullPath, true);
          }
        });
        if (size) {
          result.resize(filesPaths * size, size);
        }
        result.write(destPath, (error) => {
          if (error) {
            reject(error);
          }
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    } else {
      reject(new Error('no images found'));
    }
  });
};

module.exports = emojisSpriteGenerator;
