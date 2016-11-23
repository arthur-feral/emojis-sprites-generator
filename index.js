'use strict';

const superagent = require('superagent');
const when = require('when');
const lib = require('./lib')(superagent);
const generator = lib.generator;
const scrapper = lib.scrapper;
const logger = lib.logger;

/**
 * default config provided to module
 * @type {{destination: string, size: number, fromCache: boolean, prefix: string}}
 */
const DEFAULT_CONFIG = {
  destination: [process.cwd(), 'emojis-generator'].join('/'),
  size: 24,
  fromCache: true,
  prefix: 'emojis'
};

/**
 * parse cli args and build config to provide to the module
 * @param commander
 * @returns {{destination: string, size: number, fromCache: boolean, prefix: string}}
 */
const getConfig = (commander) => {
  let config = DEFAULT_CONFIG;

  if (commander.destination) {
    config['destination'] = commander.destination;
  }

  if (commander.size) {
    config['size'] = commander.size;
  }

  if (commander.prefix) {
    config['prefix'] = commander.prefix;
  }

  if (commander.cache) {
    config['fromCache'] = commander.fromCache;
  }

  return config;
};

/**
 * core module entry point
 * @param config
 */
const emojisModule = (config) => {
  logger.success('Starting...');
  scrapper.scrap(config)
    .then((datas) => {
      logger.success('Successfully retrived datas.');
      logger.info('Getting images...');
      return when.all([
        datas,
        scrapper.scrapImages(config, datas)
      ]);
    })
    .then((datas) => {
      logger.info('Processing images...');

      return when.all([
        datas[0],
        generator.generateImages(config.size, datas[1][1])
      ]);
    })
    .then((datas) => {
      logger.info('Generating themes...');
      return generator.generateThemes(config, datas[0], datas[1][0]);
    })
    .then((lol) => {
      logger.success('Themes generated');

    })
    .catch(logger.error);
};

/**
 * Entry point
 * @param commander
 */
const run = (commander) => {
  let config = getConfig(commander);

  emojisModule(config);
};

module.exports = {
  run
};

emojisModule(DEFAULT_CONFIG);
