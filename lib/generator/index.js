'use strict';

const lessGenerator = require('./lessGenerator/');

const _ = require('lodash');
const gm = require('gm');
const fs = require('fs');
const when = require('when');

const nl = (process.platform === 'win32' ? '\r\n' : '\n');

/**
 * generate emojis sprite resources
 * @param {object} config an object containing config
 * {
 *    {string} imagesPath path to emojis png folder,
 *    {object} json containing emojis list
 *    {string} destinationPath build folder destination (default current)
 *    {int} size size in px for emojis height sprite (default 24)
 * }
 */
const generator = (config) => {
  console.log(config);
  const themeName = config.theme || 'emojis';
  const pathToEmojisImages = config.imagesPath;
  const emojisList = config.json;
  const destinationPath = config.destinationPath || process.cwd();
  const size = config.size || 24;

  if (!pathToEmojisImages) {
    throw new Error('A valid path for emojis images is required');
  }

  if (!emojisList) {
    throw new Error('The emojis list is required');
  }

  let lessFile = '';
  const spritePath = `${destinationPath}/${themeName}.png`;
  const lessPath = `${destinationPath}/${themeName}.less`;
  let emojisCount = 0;
  let sprite = null;
  _.each(emojisList, (emojis, category) => {
    _.each(emojis, (emoji) => {
      let imagePath = `${pathToEmojisImages}/${category}/${emoji.shortname}.png`;
      if (!sprite) {
        sprite = gm(imagePath)
      } else {
        sprite.append(imagePath, true);
      }
      lessFile += lessGenerator.emoji(emoji.shortname, emojisCount, size);
      emojisCount++;
    });
  });

  lessFile = [lessGenerator.base(spritePath, emojisCount, size), lessFile].join(nl);

  if (size) {
    sprite.resize(emojisCount * size, size);
  }
  return when.promise((resolve, reject) => {
    sprite.write(spritePath, (error) => {
      if (error) {
        reject(error);
      }

      fs.writeFile(lessPath, lessFile, (err) => {
        if (err) {
          reject(err);
        }

        resolve();
      });
    });
  });
};

module.exports = generator;
