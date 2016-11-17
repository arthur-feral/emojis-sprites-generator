'use strict';

const generator = require('./lib').generator;
const scrapper = require('./lib').scrapper;
const fs = require('fs');
const _ = require('lodash');

const emojisModule = (config) => {
  console.log('Starting scrapper...');
  scrapper.scrap()
    .then((datas) => {
      try {
        fs.accessSync(config.destination, fs.F_OK);
      } catch (error) {
        fs.mkdirSync(config.destination);
      }
      fs.writeFileSync(`${config.destination}/emojis.json`, JSON.stringify(datas), 'utf8');
      console.log('Successfully writen emojis json file.');

      return scrapper.scrapImages(config, datas)
        .then((themes)=> {
          console.log('Generating sprites...');
          _.each(themes, (theme) => {
            let themeDatas = _.merge({}, datas);
            _.each(datas, (category => {
              themeDatas[category.name].emojis = _.sortBy(_.filter(category.emojis, (emoji) => _.has(emoji.themes, theme)), 'index');
            }));

            return generator.generateSprite(theme, themeDatas, config.size, config.destination);
          });
        }).finally(() => {
          console.log('Done.');
        });
    });
};

emojisModule({
  size: 24,
  destination: 'test'
});

module.exports = emojisModule;
