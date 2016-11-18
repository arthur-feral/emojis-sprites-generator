'use strict';

const lessGenerator = require('./lessGenerator/');

const _ = require('lodash');
const gm = require('gm');
const fs = require('fs');
const when = require('when');
const sizeOf = require('image-size');
const nl = (process.platform === 'win32' ? '\r\n' : '\n');

/**
 * generate emojis sprite resources
 * @param {object} config an object containing config
 * {
 *    {string} imagesPath path to emojis png folder,
 *    {object} json containing emojis list
 *    {string} destinationPath build folder destination (default current)
 *    {int} size size in px for emojis height sprite (default 48)
 * }
 */
const generator = (config) => {
  const themeName = config.theme || 'emojis';
  const pathToEmojisImages = config.imagesPath;
  const categories = config.json;
  const destinationPath = config.destinationPath || process.cwd();
  const size = config.size || 48;

  if (!pathToEmojisImages) {
    throw new Error('A valid path for emojis images is required');
  }

  if (!categories) {
    throw new Error('Missing emojis datas');
  }

  let lessFile = '';
  const spritePath = `${destinationPath}/${themeName}.png`;
  const lessPath = `${destinationPath}/${themeName}.less`;
  let emojisCount = 0;
  let sprite = null;
  let totalWidth = 0;
  _.each(categories, (category) => {
    _.each(category.emojis, (emoji) => {
      let imagePath = `${pathToEmojisImages}/${category.name}/${emoji.shortname}.png`;
      let dimensions = sizeOf(imagePath);
      if (!sprite) {
        sprite = gm(imagePath)
      } else {
        sprite.append(imagePath, true);
      }
      lessFile += lessGenerator.emoji(emoji.shortname, totalWidth);
      emojisCount++;
      totalWidth += dimensions.width;
    });
  });

  lessFile = [lessGenerator.base(spritePath, totalWidth, size), lessFile].join(nl);

  if (size) {
    sprite.resize(totalWidth, size);
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

/**
 *
 * @param themeName
 * @param categories
 * @param size
 * @param destination
 */
const generateSprite = function(themeName, categories, size, destination) {
  generator({
    imagesPath: `${destination}/images/${themeName}`,
    json: categories,
    destinationPath: `${destination}/images/${themeName}`,
    theme: themeName,
    size: size
  }).then(() => {
    fs.writeFileSync(`${destination}/images/${themeName}/${themeName}.json`, JSON.stringify(categories), 'utf8');
    console.log(`Sprite generated for ${themeName}`);
  });
};

module.exports = {
  generator,
  generateSprite
};
