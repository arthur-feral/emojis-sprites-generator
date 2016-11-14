'use strict';

const _ = require('lodash');
const fs = require('fs');
const gm = require('gm');
const when = require('when');

let emojisSpriteGenerator = (sourcePath, destPath) => {
  const path = `${process.cwd()}/${sourcePath}`;
  const filesPaths = fs.readdirSync(path);
  let result = null;
  return when.promise((resolve, reject) => {
    if (filesPaths.length) {
      try {
        _.each(filesPaths, (filePath) => {
          let fileFullPath = `${path}/${filePath}`.split('/').filter((tempPath) => tempPath.length).join('/');
          fileFullPath = `/${fileFullPath}`;
          if (!result) {
            result = gm(fileFullPath);
          } else {
            result.append(fileFullPath, true);
          }
        });
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
