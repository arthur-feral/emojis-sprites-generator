'use strict';

const _ = require('lodash');
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

const emojipediaMainUrl = 'http://emojipedia.org';

const reduceCategories = (datas) => {
  return _.reduce(datas, function(result, value) {
    result = _.merge(result, value);

    return result;
  }, {});
};

const scrapCategories = (categories) => {

  return when.all(_.map(categories, scrapCategory))
    .spread(function() {
      let orderedCategories = reduceCategories(arguments);
      console.log(`scrapped ${_.size(orderedCategories)} categories`);

      return when.all(_.map(orderedCategories, (emojiscategory) => {

          return when.all(_.map(emojiscategory.emojis, scrapEmoji))
            .spread(function() {
              console.log(`scrapped ${arguments.length} emojis`);
              orderedCategories[emojiscategory.name].emojis = _.reduce(arguments, function(emojis, value) {
                emojis = _.merge(emojis, value);

                return emojis;
              }, {});

              return orderedCategories;
            });
        }))
        .spread(function() {
          console.log(`Scrap finished`);

          return reduceCategories(arguments);
        });
    });
};

const scrapCategory = (category) => {
  console.log('scrapCategory', category.name);
  return when.promise((resolve, reject) => {
    superagent.get(category.url)
      .use(throttle.plugin())
      .end((error, result) => {
        if (error) {
          console.log('arf');
          reject(error);
        }
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

const scrapEmoji = (emojiRaw) => {
  return when.promise((resolve, reject) => {
    superagent.get(emojiRaw.url)
      .use(throttle.plugin())
      .end((error, result) => {
        if (error) {
          console.log('error scrapEmoji');
          console.log(emojiRaw);
          console.log(error);
          reject(error);
        }
        let emoji = _.merge({
          themes: []
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

          emoji.themes.push({
            [themeName]: imagePath
          });
        });

        $article.find('section.vendor-list').remove();

        // remove ads
        $article.find('.ad-below-images').remove();

        // Get modifiers
        const $modifiersList = $article.find('section.modifiers');
        if($modifiersList.length) {
          let $modifiers = $modifiersList.find('a');

        }

        $modifiersList.remove();

        resolve({
          [emoji.shortname]: emoji
        });
      });
  });
};

const scrapper = (theme) => {
  console.log('scrapping...');

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
      // $categoriesBlock.find('a').each(function() {
      //   $(this).find('.emoji').remove();
      //   const text = $(this).text();
      //
      //   categories.push({
      //     fullname: text.replace(/^ /, ''),
      //     name: $(this).attr('href').replace(/\//g, ''),
      //     url: `${emojipediaMainUrl}${$(this).attr('href')}`
      //   });
      // });

      let $link = $categoriesBlock.find('a').first()
      $link.find('.emoji').remove();
      const text = $link.text();

      categories.push({
        fullname: text.replace(/^ /, ''),
        name: $link.attr('href').replace(/\//g, ''),
        url: `${emojipediaMainUrl}${$link.attr('href')}`
      });

      if (!categories.length) {
        reject(new Error('No categories found'));
      }

      resolve(scrapCategories(categories));
    });
  });
};

module.exports = scrapper;
