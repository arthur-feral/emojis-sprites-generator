'use strict';

const fs = require('fs');
const lessFileTemplate = fs.readFileSync(`${__dirname}/lessFile`, 'utf8');
const emojiTemplate = fs.readFileSync(`${__dirname}/emoji`, 'utf8');

/**
 * returns a string containing base less file for emojis
 * @param {string} spritePath path to the sprite
 * @param {int} emojisCount count of emojis present in the sprite
 * @param {int} emojiSize size of an emoji
 * @returns {string}
 */
const base = (spritePath, emojisCount, emojiSize) => {
  return ['', lessFileTemplate
    .replace('<%emojiSize%>', emojiSize)
    .replace('<%pathToSprite%>', spritePath)
    .replace('<%spriteWidth%>', emojisCount * emojiSize)
    .replace('<%spriteHeight%>', emojiSize)].join('');
};

/**
 * returns special less rule for an emoji
 * @param {string} name emoji name
 * @param {int} position emoji position
 * @returns {string}
 */
const emoji = (name, position) => {
  return ['', emojiTemplate
    .replace('<%emojiName%>', name)
    .replace('<%emojiXPosition%>', position === 0 ? '0' : `${position}px`)].join('');
};

module.exports = {
  base,
  emoji
};
