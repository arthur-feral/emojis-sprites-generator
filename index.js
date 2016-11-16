'use strict';

const generator = require('./lib').generator;
const scrapper = require('./lib').scrapper;
const fs = require('fs');
const _ = require('lodash');

const jsonPath = `${process.cwd()}/emojis.json`;

const emojisModule = (config) => {

};

console.log('Starting scrapper...');
scrapper.scrap()
  .then((datas) => {
    fs.writeFileSync(jsonPath, JSON.stringify(datas), 'utf8');
    console.log('Successfully writen emojis json file.');

    return scrapper.scrapImages(datas)
      .then((themes)=> {
        console.log('Generating sprites...');
        _.each(themes, (theme) => {
          return generator.generateSprite(theme, datas);
        });
      }).finally(() => {
        console.log('Done.');
      });
  });
