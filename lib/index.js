'use strict';

module.exports = (superagent) => {
  const utils = require('./utils');
  const logger = require('./logger');
  const generator = require('./generator')(logger);
  const crawler = require('./crawler')(logger);
  const scrapper = require('./scrapper')(superagent, crawler, utils, logger);

  return {
    generator,
    crawler,
    scrapper,
    logger,
    utils
  };
};
