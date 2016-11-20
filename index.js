'use strict';

const generator = require('./lib').generator;
const scrapper = require('./lib').scrapper;
const when = require('when');
const fs = require('fs');
const _ = require('lodash');

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

module.exports = emojisModule;

/**
 *  Example
 emojisModule({
  size: 24,
  destination: 'test',
  fromCache: true
});
 */
