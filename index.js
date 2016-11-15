'use strict';

const _ = require('lodash');
const gm = require('gm');
const fs = require('fs');
const when = require('when');

const lessGenerator = require('./lib/lessGenerator');
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
  const pathToEmojisImages = config.imagesPath;
  const emojisList = config.emojis;
  const destinationPath = config.destinationPath || process.cwd();
  const size = config.size || 24;

  if (!pathToEmojisImages) {
    throw new Error('A valid path for emojis images is required');
  }

  if (!emojisList) {
    throw new Error('The emojis list is required');
  }

  let lessFile = '';
  const spritePath = `${destinationPath}/emojis.png`;
  const lessPath = `${destinationPath}/emojis.less`;
  let emojisCount = 0;
  let sprite = null;
  _.each(emojisList.categories, (category) => {
    _.each(category.emojis, (emoji) => {
      let imagePath = `${pathToEmojisImages}/${emoji.name}.png`;
      if (!sprite) {
        sprite = gm(imagePath)
      } else {
        sprite.append(imagePath, true);
      }
      lessFile += lessGenerator.emoji(emoji.name, emojisCount, size);
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
