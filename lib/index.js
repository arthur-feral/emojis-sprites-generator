'use strict';

module.exports = (superagent) => {
  const generator = require('./generator');
  const crawler = require('./crawler')();
  const scrapper = require('./scrapper')(superagent, crawler);

  return {
    generator,
    scrapper
  };
};
