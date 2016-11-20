'use strict';

const generator = require('./lib').generator;
const scrapper = require('./lib').scrapper;
const when = require('when');
const _ = require('lodash');
const DEFAULT_CONFIG = {
  destination: [process.cwd(), 'emojis-generator'].join('/'),
  size: 24,
  fromCache: false,
  prefix: 'emojis'
};

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

const emojisModule = (config) => {
  console.log('Starting scrapper...');
  scrapper.scrap(config)
    .then((datas) => {
      return when.all([
        datas, scrapper.scrapImages(config, datas)
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
    });
};

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
  prefix: 'idz-emoji-'
});
 */
