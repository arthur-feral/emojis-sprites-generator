'use strict';

const generator = require('./lib').generator;
const scrapper = require('./lib').scrapper;
const crawl = require('./lib').crawler;
const fs = require('fs');
const _ = require('lodash');

const emojisModule = (config) => {
  console.log('Starting scrapper...');
  scrapper.scrap(config)
    // .then(() => {
    //   return crawl(config);
    // })
    .then((datas) => {
      //return scrapper.scrapImages(config, datas);
    }).then((themes) => {
    // console.log('Generating sprites...');
    // _.each(themes, (theme) => {
    //   let themeDatas = _.merge({}, datas);
    //   _.each(datas, (category => {
    //     themeDatas[category.name].emojis = _.sortBy(_.filter(category.emojis, (emoji) => _.has(emoji.themes, theme)), 'index');
    //   }));
    //
    //   return generator.generateSprite(theme, themeDatas, config.size, config.destination);
    // });
  });
};

emojisModule({
  size: 24,
  destination: 'test',
  fromCache: false
});

module.exports = emojisModule;
