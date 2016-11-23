'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const os = require('os');
const when = require('when');
const lessFileTemplate = fs.readFileSync(`${__dirname}/lessFile`, 'utf8');
const emojiTemplate = fs.readFileSync(`${__dirname}/emoji`, 'utf8');

/**
 * returns a string containing base less file for emojis
 * @param {string} prefix the classname prefix
 * @param {string} spritePath path to the sprite
 * @param {int} width count of emojis present in the sprite
 * @param {int} height size of an emoji
 * @returns {string}
 */
const base = (prefix, spritePath, width, height) => {
  return ['', lessFileTemplate
    .replace(/<%prefix%>/gm, prefix)
    .replace('<%emojiSize%>', height)
    .replace('<%pathToSprite%>', spritePath)
    .replace('<%spriteWidth%>', width)
    .replace('<%spriteHeight%>', height)].join('');
};

/**
 * returns special less rule for an emoji
 * @param {string} prefix the classname prefix
 * @param {string} name emoji name
 * @param {int} position emoji position
 * @returns {string}
 */
const emoji = (prefix, name, position) => {
  return ['', emojiTemplate
    .replace(/<%prefix%>/gm, prefix)
    .replace('<%emojiName%>', name)
    .replace('<%emojiXPosition%>', position === 0 ? '0' : `-${position}px`)].join('');
};

/**
 * generate a less file from datas
 * @param theme
 * @param prefix
 * @param emojis
 * @param dimensions
 * @param destination
 * @returns {*|Promise}
 */
const generate = (theme, prefix, emojis, dimensions, destination) => {
  return when.promise((resolve, reject) => {
    let finalPath = `${destination}/${theme}/${theme}.less`;
    let lessContent = base(prefix, `${destination}/${theme}/${theme}.png`, dimensions.width, dimensions.height) + os.EOL;
    _.each(emojis, (e, index) => {
      lessContent += emoji(prefix, e.shortname, (index * dimensions.height) + (index === 0 ? 0 : 1)) + os.EOL;
    });

    fs.mkdirpSync(`${destination}/${theme}`);

    fs.writeFile(finalPath, lessContent, 'utf8', (error) => {
      if (error) {
        reject(error);
      }

      resolve(finalPath);
    });
  });
};

module.exports = {
  base,
  emoji,
  generate
};
