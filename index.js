'use strict';

const spriteGenerator = require('./lib/spriteGenerator');
const lessGenerator = require('./lib/lessGenerator');

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
  // spriteGenerator(config.emojisImages, config.spriteDestination, config.emojisSize).then(()=> {
  //   lessGenerator(config.spriteDestination, config.emojisList, config.spriteDestination, config.emojisSize);
  // });
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

  
};

module.exports = generator;
