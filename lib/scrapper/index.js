'use strict';

const fs = require('fs');
const _ = require('lodash');
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

const emojipediaMainUrl = 'http://emojipedia.org';
let emojisScrapped = 0;

let imagesDone = 0;
let imagesRequest = [];
const imagesPath = `${process.cwd()}/images`;

let themesAvailables = [];
const allThemes = ['apple', 'emoji-one', 'emojidex', 'emojipedia', 'facebook', 'google', 'htc', 'lg', 'microsoft', 'mozilla', 'samsung', 'twitter', 'whatsapp'];

/**
 * format correctly categories object created by scapper
 * @param datas
 * @returns {*}
 */
const reduceDatas = (datas) => {
  return _.reduce(datas, function(result, value) {
    result = _.merge(result, value);

    return result;
  }, {});
};

/**
 * scrap categories
 * @param categories
 * @returns {Promise}
 */
const scrapCategories = (categories) => {

  return when.all(_.map(categories, scrapCategory))
    .spread(function() {
      let orderedCategories = reduceDatas(arguments);
      console.log(`scrapped ${_.size(orderedCategories)} categories`);

      return when.all(_.map(orderedCategories, (emojiscategory) => {

          return when.all(_.map(emojiscategory.emojis, scrapEmoji))
            .spread(function() {
              console.log(`scrapped ${arguments.length} emojis for category ${emojiscategory.name}`);
              orderedCategories[emojiscategory.name].emojis = reduceDatas(arguments);

              return orderedCategories;
            });
        }))
        .spread(function() {
          console.log(`Scrap finished (${emojisScrapped} emojis)`);

          return reduceDatas(arguments);
        });
    });
};

/**
 * scrap emojis list on specified category
 * @param category
 * @returns {*|Promise}
 */
const scrapCategory = (category) => {
  return when.promise((resolve, reject) => {
    console.log(`Scrapping category ${category.name}...`);
    superagent.get(category.url)
      .use(throttle.plugin())
      .end((error, result) => {
        if (error) {
          reject(error);
        }
        console.log(`Scrapped category ${category.name}`);

        let $ = cheerio.load(result.text);

        const $emojisList = $('.emoji-list');
        const $links = $emojisList.find('a');

        if (!$links.length) {
          reject(new Error('Error parsing emojis list'));
        }

        let emojis = [];
        $links.each(function() {
          emojis.push({
            url: `${emojipediaMainUrl}${$(this).attr('href')}`,
            shortname: $(this).attr('href').replace(/\//g, ''),
            char: $(this).find('.emoji').text(),
            category: category.name
          });
        });

        resolve({
          [category.name]: _.merge(category, {
            emojis: emojis
          })
        });
      });
  });
};

const scrapEmoji = (emojiRaw, index) => {
  return when.promise((resolve, reject) => {
    superagent.get(emojiRaw.url)
      .use(throttle.plugin())
      .end((error, result) => {
        if (error) {
          reject(error);
        }
        emojisScrapped++;
        process.stdout.write(emojisScrapped + ' emojis scrapped \r');
        let emoji = _.merge({
          themes: {},
          index: index
        }, emojiRaw);
        let $ = cheerio.load(result.text);
        let $article = $('article');

        // Get emoji name from title
        let $title = $article.find('h1').first();
        $title.find('.emoji').remove();
        emoji.fullName = $title.text().replace(/^ /, '');
        $title.remove();

        // remove description
        $article.find('section.description').remove();

        // remove aliases
        $article.find('section.aliases').remove();

        // get images
        let $availableThemes = $article.find('.vendor-list').find('.vendor-rollout-target');
        $availableThemes.each(function() {
          const themeName = $(this).find('.vendor-info').first().find('a').attr('href').replace(/\//g, '');
          const imagePath = $(this).find('.vendor-image').first().find('img').attr('src');

          emoji.themes[themeName] = imagePath;
        });

        $article.find('section.vendor-list').remove();

        // remove ads
        $article.find('.ad-below-images').remove();

        // Get modifiers
        const $modifiersList = $article.find('section.modifiers');
        if ($modifiersList.length) {
          let $modifiers = $modifiersList.find('a');

        }

        $modifiersList.remove();

        resolve({
          [emoji.shortname]: emoji
        });
      });
  });
};

/**
 * globally scrap emojipedia website
 * @returns {*|Promise}
 */
const scrap = () => {

  return when.resolve(require(`${process.cwd()}/emojis.json`));
  
  emojisScrapped = 0;

  return when.promise((resolve, reject) => {
    superagent.get(emojipediaMainUrl).end((error, result) => {
      if (error) {
        reject(error);
      }

      let $ = cheerio.load(result.text);
      const $categoriesBlock = $('div.sidebar div.block').first();
      if ($categoriesBlock.find('h2').text() !== 'Categories') {
        reject(new Error('Html structure has changed, need update'));
      }

      const categories = [];
      $categoriesBlock.find('a').each(function() {
        $(this).find('.emoji').remove();
        const text = $(this).text();

        categories.push({
          fullname: text.replace(/^ /, ''),
          name: $(this).attr('href').replace(/\//g, ''),
          url: `${emojipediaMainUrl}${$(this).attr('href')}`
        });
      });

      if (!categories.length) {
        reject(new Error('No categories found'));
      }

      resolve(scrapCategories(categories));
    });
  });
};

/**
 * Get images from emojis themes data
 * @param datas
 * @returns {Promise}
 */
const scrapImages = (datas) => {

  return when.resolve(allThemes);

  imagesDone = 0;
  imagesRequest = [];
  themesAvailables = [];

  try {
    fs.accessSync(imagesPath, fs.F_OK);
  } catch (error) {
    fs.mkdirSync(imagesPath);
  }
  _.each(datas, (category) => {
    _.each(category.emojis, (emoji) => {
      _.each(emoji.themes, (url, themeName) => {
        if (themesAvailables.indexOf(themeName) === -1) {
          themesAvailables.push(themeName);
        }
        imagesRequest.push(when.promise((resolve, reject) => {
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

  console.log(`getting ${imagesRequest.length} images...`);
  return when.all(imagesRequest).spread(function() {
    console.log(`${imagesDone} images writen \n`);
    return themesAvailables;
  });
};

module.exports = {
  scrap,
  scrapImages
};
