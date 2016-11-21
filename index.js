'use strict';

const superagent = require('superagent');
const lib = require('./lib')(superagent);
const generator = lib.generator;
const scrapper = lib.scrapper;
const when = require('when');
const _ = require('lodash');

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
  console.log('Starting scrapper...');
  scrapper.scrap(config)
    .then((datas) => {
      console.log('Done.');
      return when.all([
        datas, scrapper.scrapImages(config, datas)
      ]).spread(function(d, t) {
        return [d, t];
      });
    })
    .then((datas) => {
      return when.all([
        datas, generator.generateImages(datas[0])
      ]).spread(function(d, t) {
        return [d, t];
      });
    })
    .then((datas) => {
      console.log('Generating sprites...');
      return when.all(_.map(datas[1], (theme) => {
        let themeDatas = _.merge({}, datas[0]);
        _.each(datas[0], (category => {
          themeDatas[category.name].emojis = _.sortBy(_.filter(category.emojis, (emoji) => _.has(emoji.themes, theme)), 'index');
        }));

        return generator.generateSprite(theme, themeDatas, config.size, config.destination);
      }));
    })
    .catch((error) => {
      console.log(error);
    });
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

/**
 *  Example
 emojisModule({
  size: 24,
  destination: 'test',
  fromCache: true,
  prefix: 'idz-emoji'
});
 */

emojisModule({
  size: 24,
  destination: 'test',
  fromCache: true,
  prefix: 'idz-emoji'
});
