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
    .replace('<%emojiXPosition%>', `${position}px`)].join('');
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
    let offsetModifiers = 0;
    _.each(emojis, (emo, index) => {
      if (emojis[index - 1] && _.has(emojis[index - 1], 'modifiers')) {
        offsetModifiers = offsetModifiers + emojis[index - 1].modifiers.length;
      }
      lessContent += emoji(prefix, emo.shortname, -1 * ((index + offsetModifiers) * (dimensions.height - 1))) + os.EOL;
      if (_.has(emo, 'modifiers')) {
        _.each(emo.modifiers, (modifier, i) => {
          lessContent += emoji(prefix, modifier.shortname, -1 * ((index + i + offsetModifiers + 1) * (dimensions.height - 1))) + os.EOL;
        });
      }
    });

    fs.mkdirpSync(`${destination}/${theme}`);

    fs.writeFile(finalPath, lessContent, 'utf8', (error) => {
      if (error) {
        reject(error);
      }

      resolve(finalPath);
    });
  }).catch((error) => {
    logger.error(`[less][generate] An error occured while creating less file: ${error.message}`);
  });
};


/**
 * this module is used to generate less file
 */
module.exports = {
  base,
  emoji,
  generate
};
