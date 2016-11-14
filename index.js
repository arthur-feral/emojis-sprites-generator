'use strict';

const spriteGenerator = require('./lib/spriteGenerator');
const lessGenerator = require('./lib/lessGenerator');

/**
 * generate emojis sprite resources
 * @param {object} config an object containing config
 * {
 *    {string} emojisImages path to emojis png folder,
 *    {string} spriteDestination destination of resources,
 *    {int} emojisSize size in px for emojis height sprite,
 *    {object} emojisList json containing emojis list
 * }
 */
const generator = (config) => {
  spriteGenerator(config.emojisImages, config.spriteDestination, config.emojisSize).then(()=> {
    lessGenerator(config.spriteDestination, config.emojisList, config.spriteDestination, config.emojisSize);
  });
};

module.exports = generator;
