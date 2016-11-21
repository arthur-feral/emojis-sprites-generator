'use strict';

const fs = require('fs');
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

module.exports = {
  base,
  emoji
};
