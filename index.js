'use strict';

const _ = require('lodash');
const generator = require('./lib').generator;
const scrapper = require('./lib').scrapper;
const themes = ['apple', 'google', 'microsoft', 'samsung', 'lg', 'htc', 'facebook', 'twitter', 'mozilla', 'emoji-one', 'emojidex'];
const fs = require('fs');
const superagent = require('superagent');
const when = require('when');
const cheerio = require('cheerio');
const Throttle = require('superagent-throttle');
let throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 20,          // how many requests can be sent every `ratePer`
  ratePer: 50,   // number of ms in which `rate` requests may be sent
  concurrent: 5     // how many requests can be sent concurrently
});

const emojisModule = (config) => {

};

console.log('Starting scrapper...');
scrapper().then((datas) => {
  let imagesRequest = [];
  const cwd = process.cwd();
  _.each(datas, (category) => {
    _.each(category.emojis, (emoji) => {
      _.each(emoji.themes, (theme) => {
        imagesRequest.push(when.promise((resolve, reject) => {
          console.log(`Getting ${cwd}/images/${category.name}_${emoji.name}.png...`);
          superagent.get(theme)
            .use(throttle.plugin())
            .end((error, result) => {
              if (error) {
                console.log('arf');
                reject(error);
              }
              console.log(result);
              fs.writeFile(`${cwd}/images/${category.name}_${emoji.name}.png`, result.body, function(error) {
                if (error) {
                  console.log('error', error);
                  reject(error);
                }
                resolve(`${cwd}/images/${category.name}_${emoji.name}.png done.`);
              });
            });
        }));
      });
    })
  });
  fs.writeFileSync(`${cwd}/emojis.json`, JSON.stringify(emojis), 'utf8');
  console.log('Successfully writen emojis json file.');
  console.log(`getting ${imagesRequest.length} images...`);
  return when.all(imagesRequest).spread(function() {
    console.log(`${arguments.length} images writen`);
  });
}).finally(() => {
  console.log('Done.');
});
