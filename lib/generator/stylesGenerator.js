import fs from 'fs-extra';
import os from 'os';
import {
  map,
} from 'lodash';

/**
 *
 * @param config
 * @param emitter
 * @return {function(*, *=, *, *, *)}
 */
export default (config, emitter) => {
  const baseTemplate = fs.readFileSync(`${process.cwd()}/res/${config.preproc}/base`, 'utf8');
  const emojiTemplate = fs.readFileSync(`${process.cwd()}/res/${config.preproc}/emoji`, 'utf8');

  /**
   * returns a string containing base sass file for emojis
   * @param {string} prefix the classname prefix
   * @param {string} spritePath path to the sprite
   * @param {number} spriteWidth count of emojis present in the sprite
   * @param {number} spriteHeight size of an emoji
   * @param {number} emojiSize size of an emoji
   * @returns {string}
   */
  const generateBase = (prefix, spritePath, spriteWidth, spriteHeight, emojiSize) => {
    return [
      '', baseTemplate
        .replace(/<%prefix%>/gm, prefix)
        .replace('<%pathToSprite%>', spritePath)
        .replace('<%spriteWidth%>', spriteWidth)
        .replace('<%spriteHeight%>', spriteHeight)
        .replace('<%emojiSize%>', emojiSize),
    ].join('');
  };

  /**
   * returns special sass rule for an emoji
   * @param {string} prefix the classname prefix
   * @param {string} name emoji name
   * @param {number} positionX emoji position
   * @param {number} positionY emoji position
   * @returns {string}
   */
  const generateEmoji = (prefix, name, positionX, positionY) => {
    return [
      '', emojiTemplate
        .replace(/<%prefix%>/gm, prefix)
        .replace('<%emojiName%>', name)
        .replace('<%emojiXPosition%>', positionX)
        .replace('<%emojiYPosition%>', positionY),
    ].join('');
  };

  /**
   * generate a sass file from datas
   * @param {string} theme
   * @param {string} prefix
   * @param {array} emojis
   * @param {object} properties
   * @param {object} coordinates
   * @returns {*|Promise}
   */
  return (theme, emojis, properties, coordinates) => {
    const spritePath = `${config.destination}/${theme}/${theme}.png`;
    const coordinatesArray = map(coordinates, c => c);
    let sassContent = generateBase(config.prefix, spritePath, properties.width, properties.height, config.size) + os.EOL;

    emojis.map((emoji, index) => {
      sassContent += generateEmoji(config.prefix, emoji.name, coordinatesArray[index].x, coordinatesArray[index].y);
    });

    return sassContent;
  };
};