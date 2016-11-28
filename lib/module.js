'use strict';

const when = require('when');
const _ = require('lodash');

module.exports = (scrapper, generator, logger) => {

  /**
   * default config provided to module
   * @type {{destination: string, size: number, fromCache: boolean, prefix: string}}
   */
  const DEFAULT_CONFIG = {
    destination: [process.cwd(), 'emojis-generator'].join('/'),
    size: 24,
    fromCache: false,
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
      config['size'] = parseInt(commander.size, 10);
    }

    if (commander.prefix) {
      config['prefix'] = commander.prefix;
    }

    if (commander.cache) {
      config['fromCache'] = commander.cache;
    }

    if (!commander.preproc) {
      throw new Error('[getConfig] the preprocessor type is required');
    }

    config['preproc'] = commander.preproc;

    return config;
  };

  /**
   * core module entry point
   * @param config
   * @return {Promise}
   */
  const emojisModule = (config) => {
    logger.success('Starting...');

    // First we scrap datas from website
    return scrapper.scrap(config)

      // the we collect images from different themes
      .then((datas) => {
        logger.success('Successfully retrived datas.');
        logger.info('Collecting images...');
        return when.all([
          datas,
          scrapper.scrapImages(config, datas)
        ]);
      })

      // then we resize images with the specified size
      .then((datas) => {
        // datas[0] contains emojis json datas
        // datas[1][0] Is an array containing all available themes
        // datas[1][1] Is an array containing all images paths
        logger.info('Processing images...');

        return when.all([
          datas[0],
          datas[1][0],
          generator.generateImages(config.size, datas[1][1])
        ]);
      })

      // then we generate sprites for the differents collected themes
      .then((datas) => {
        // datas[0] contains emojis json datas
        // datas[1] Is an array containing all available themes
        logger.info('Generating themes...');
        return generator.generateThemes(config, datas[0], datas[1]);
      })
      .catch(logger.error);
  };

  /**
   * Entry point
   * @param commander
   * @return {Promise}
   */
  const run = (commander) => {
    let config = getConfig(commander);
    _.each(config, (conf, name) => {
      logger.info(`${name}: ${conf}`);
    });

    return emojisModule(config)
      .finally(() => {
        logger.success('Done.');
      });
  };

  return {
    run
  };
};
