'use strict';

module.exports = (superagent) => {
  const logger = require('./logger');
  const generator = require('./generator');
  const crawler = require('./crawler')(logger);
  const scrapper = require('./scrapper')(superagent, crawler, logger);

  return {
    generator,
    scrapper
  };
};
