'use strict';

const _ = require('lodash');
const generator = require('./lib').generator;
const scrapper = require('./lib').scrapper;
const fs = require('fs');
const superagent = require('superagent');
const when = require('when');
const cheerio = require('cheerio');
const Throttle = require('superagent-throttle');
let throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 20,          // how many requests can be sent every `ratePer`
  ratePer: 50,   // number of ms in which `rate` requests may be sent
  concurrent: 10     // how many requests can be sent concurrently
});
const cwd = process.cwd();
const imagesPath = `${cwd}/images`;
const jsonPath = `${cwd}/emojis.json`;
// const themes = [];
const themes = ['apple', 'google', 'microsoft', 'samsung', 'lg', 'htc', 'facebook', 'twitter', 'mozilla', 'emoji-one', 'emojidex', 'whatsapp'];

const emojisModule = (config) => {

};

const generateSprites = function(themeName) {
  const categories = require(jsonPath);
  let json = {};
  _.each(categories, (category => {
    if (!json[category.name]) {
      json[category.name] = {
        emojis: []
      };
    }
    json[category.name] = _.sortBy(_.filter(category.emojis, (emoji) => _.has(emoji.themes, themeName)), 'index');
  }));
  generator({
    imagesPath: `${imagesPath}/${themeName}`,
    json: json,
    destinationPath: `${imagesPath}/${themeName}`,
    theme: themeName
  }).then((msg) => {
    console.log(`Sprite generated for ${themeName}`);
  });
};


console.log('Starting scrapper...');
scrapper().then((datas) => {
  let imagesDone = 0;
  let imagesRequest = [];

  try {
    fs.accessSync(imagesPath, fs.F_OK);
  } catch (error) {
    fs.mkdirSync(imagesPath);
  }
  _.each(datas, (category) => {
    _.each(category.emojis, (emoji) => {
      _.each(emoji.themes, (url, themeName) => {
        imagesRequest.push(when.promise((resolve, reject) => {
          if(themes.indexOf(themeName) === -1) {
            themes.push(themeName);
          }
          let themePath = `${imagesPath}/${themeName}`;
          try {
            fs.accessSync(themePath, fs.F_OK);
          } catch (error) {
            fs.mkdirSync(themePath);
          }

          superagent.get(url)
            .use(throttle.plugin())
            .end((error, result) => {
              let emojiPath = `${themePath}/${category.name}`;
              if (error) {
                console.log('arf');
                reject(error);
              }
              imagesDone++;
              try {
                fs.accessSync(emojiPath, fs.F_OK);
              } catch (error) {
                fs.mkdirSync(emojiPath);
              }
              fs.writeFile(`${emojiPath}/${emoji.shortname}.png`, result.body, function(error) {
                if (error) {
                  console.log('error', error);
                  reject(error);
                }
                process.stdout.write(imagesDone + ' images downloaded \r');
                resolve(`${emojiPath}/${emoji.shortname}.png done.`);
              });
            });
        }));
      });
    })
  });
  fs.writeFileSync(jsonPath, JSON.stringify(datas), 'utf8');
  console.log('Successfully writen emojis json file.');
  console.log(`getting ${imagesRequest.length} images...`);
  return when.all(imagesRequest).spread(function() {
    console.log(`${imagesDone} images writen \n`);
  });
}).finally(() => {
  console.log('Done.');
  // console.log('Generating sprites...');
  generateSprites('apple');
});
