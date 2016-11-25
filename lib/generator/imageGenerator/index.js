'use strict';

/**
 * imageGenerator
 * @param logger
 * @returns {{generateBaseImage, generateSprite, generateImage}}
 */
module.exports = (logger) => {
  return require('./imageGenerator')(logger);
};
