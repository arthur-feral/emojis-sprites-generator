'use strict';

const _ = require('lodash');
const fs = require('fs');
const gm = require('gm');
const when = require('when');
const sizeOf = require('image-size');

const lessFileTemplate = fs.readFileSync(`${__dirname}/lessFile`, 'utf8');
const emojiTemplate = fs.readFileSync(`${__dirname}/emoji`, 'utf8');

/**
 * generate less file from an emoji list
 * @param {string} pathToSprite
 * @param {object} emojisList
 * @param {string} destinationPath
 * @param {int} emojiSize
 */
let lessGenerator = (pathToSprite, emojisList, destinationPath, emojiSize) => {
  emojiSize = emojiSize || 24;
  const spriteDimensions = sizeOf(pathToSprite);
  let lessFile = lessFileTemplate
    .replace('<%emojiSize%>', emojiSize)
    .replace('<%pathToSprite%>', pathToSprite)
    .replace('<%spriteWidth%>', spriteDimensions.width)
    .replace('<%spriteHeight%>', spriteDimensions.height);

  _.each(emojisList.categories, (category, categoryIndex) => {
    _.each(category.emojis, (emoji, emojiIndex) => {
      const emojiXPosition = (categoryIndex + 1) * emojiIndex * emojiSize;
      lessFile += emojiTemplate
        .replace('<%emojiName%>', emoji.name)
        .replace('<%emojiXPosition%>', emojiXPosition === 0 ? 0 : `${emojiXPosition}px`);
    });
  });

  fs.writeFileSync(destinationPath, lessFile);
};

module.exports = lessGenerator;
