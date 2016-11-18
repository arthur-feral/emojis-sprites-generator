'use strict';

const fs = require('fs');
const _ = require('lodash');
const gm = require('gm');
const cheerio = require('cheerio');
const cachePath = '/tmp/cache';

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

      return when.all(_.map(orderedCategories, (emojiscategory) => {
          return when.all(_.map(emojiscategory.emojis, scrapEmoji))
            .spread(function() {
              return _.map(reduceDatas(arguments), a => a);
            }).then((simpleEmojis) => {
              console.log(`fetching ${_.size(simpleEmojis)} simple emojis`);
              return when.all(_.map(extraEmojis, (extraEmoji) => {
                  return scrapEmoji(extraEmoji, extraEmoji.index);
                }))
                .spread(function() {
                  console.log(`fetched ${arguments.length} modifiers`);
                  let fullEmojis = simpleEmojis.concat(reduceDatas(arguments));
                  console.log(`scrapped ${fullEmojis.length} emojis for category ${emojiscategory.name}`);
                  orderedCategories[emojiscategory.name].emojis = fullEmojis;

                  return orderedCategories;
                });
            });
        }))
        .spread(function() {

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
        let emoji = _.merge({
          themes: {},
          index: index,
          modifier: false
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

        if (!emoji.modifier) {
          // Get modifiers
          const $modifiersList = $article.find('section.modifiers');
          if ($modifiersList.length) {
            let $modifiers = $modifiersList.find('a');
            $modifiers.each(function() {
              const emojiShortname = $(this).attr('href').replace(/\//g, '');
              extraEmojis[emojiShortname] = {
                url: `${emojipediaMainUrl}${$(this).attr('href')}`,
                shortname: emojiShortname,
                char: $(this).find('.emoji').text(),
                category: emoji.category,
                index: index + 1,
                modifier: true
              }
            });
          }
          $modifiersList.remove();
        }

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
// const scrap = () => {
//
//   // return when.resolve(require(`${process.cwd()}/test/emojis.json`));
//
//
//   return when.promise((resolve, reject) => {
//     superagent.get(emojipediaMainUrl).end((error, result) => {
//       if (error) {
//         reject(error);
//       }
//
//       let $ = cheerio.load(result.text);
//       const $categoriesBlock = $('div.sidebar div.block').first();
//       if ($categoriesBlock.find('h2').text() !== 'Categories') {
//         reject(new Error('Html structure has changed, need update'));
//       }
//
//       const categories = [];
//       $categoriesBlock.find('a').each(function() {
//         $(this).find('.emoji').remove();
//         const text = $(this).text();
//
//         categories.push({
//           fullname: text.replace(/^ /, ''),
//           name: $(this).attr('href').replace(/\//g, ''),
//           url: `${emojipediaMainUrl}${$(this).attr('href')}`
//         });
//       });
//
//       if (!categories.length) {
//         reject(new Error('No categories found'));
//       }
//
//       resolve(scrapCategories(categories));
//     });
//   });
// };

const crawl = () => {
  
};

module.exports = crawl;
