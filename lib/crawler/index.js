'use strict';

const fs = require('fs');
const _ = require('lodash');
const gm = require('gm');
const globby = require('globby');
const when = require('when');
const cheerio = require('cheerio');
const cachePath = '/tmp/cache';
let emojisCrawled = 0;

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

const crawlIndexPage = (config) => {
  return when.promise((resolve, reject) => {
    fs.readFile(`${cachePath}/index.html`, 'utf8', (error, content) => {
      if (error) {
        reject(error);
      }

      const $ = cheerio.load(content);
      const $categoriesBlock = $('div.sidebar div.block').first();
      if ($categoriesBlock.find('h2').text() !== 'Categories') {
        reject(new Error('Html structure has changed, need update'));
      }

      const categories = [];
      $categoriesBlock.find('a').each(function() {
        $(this).find('.emoji').remove();
        const text = $(this).text();
        const url = $(this).attr('href');

        categories.push({
          fullname: text.replace(/^ /, ''),
          name: url.replace(/\//g, ''),
          url: url
        });
      });

      if (!categories.length) {
        reject(new Error('No categories found'));
      }

      resolve(categories);
    });
  });
};

/**
 * scrap categories
 * @param categories
 * @returns {Promise}
 */
const crawlCategoryPages = (config, categories) => {
  return when.all(_.map(categories, (category) => {
    return when.promise((resolve, reject) => {
      console.log(`${cachePath}/${category.name}.html`);
      fs.readFile(`${cachePath}/${category.name}.html`, 'utf8', (error, content) => {
        if (error) {
          reject(error);
        }

        const $ = cheerio.load(content);
        const $emojisList = $('.emoji-list');
        const $links = $emojisList.find('a');

        if (!$links.length) {
          reject(new Error('Error parsing emojis list'));
        }

        let emojis = [];
        $links.each(function() {
          const url = $(this).attr('href');
          emojis.push({
            url: url,
            shortname: url.replace(/\//g, ''),
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
  })).spread(function() {
    return reduceDatas(arguments);
  });
};

/**
 * scrap emojis list on specified category
 * @param category
 * @returns {*|Promise}
 */
const crawlEmojiPages = (config, categories) => {
  return when.all(_.map(categories, (category) => {
    return when.all(_.map(category.emojis, (emoji, index) => {
      return when.promise((resolve, reject) => {
        fs.readFile(`${cachePath}/${category.name}/${emoji.shortname}.html`, 'utf8', (error, content) => {
          if (error) {
            reject(error);
          }

          emoji = _.merge({
            themes: {},
            index: index
          }, emoji);

          let $ = cheerio.load(content);
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
          $article.find('section.modifiers').remove();

          emojisCrawled++;
          process.stdout.write(emojisCrawled + ' emojis processed \r');

          resolve({
            [emoji.shortname]: emoji
          });
        });
      });
    })).spread(function() {
      category.emojis = _.map(reduceDatas(arguments), a => a);
      return category;
    });
  })).spread(function() {
    return categories;
  });
};

/**
 * globally scrap emojipedia website
 * @returns {*|Promise}
 */
const crawl = (config) => {
  if (config.fromCache) {
    try {
      const datas = fs.readFileSync(`${config.destination}/emojis.json`, 'utf8');
      return when.resolve(JSON.parse(datas));
    } catch (error) {
      console.log('Cannot find emojis.json Crawling datas...');
    }
  }
  return crawlIndexPage(config)
    .then((categories) => crawlCategoryPages(config, categories))
    .then((categories) => crawlEmojiPages(config, categories))
    .then((datas) => {
      try {
        fs.accessSync(config.destination, fs.F_OK);
      } catch (error) {
        fs.mkdirSync(config.destination);
      }
      fs.writeFileSync(`${config.destination}/emojis.json`, JSON.stringify(datas), 'utf8');
      console.log('Successfully writen emojis json file.');

      return datas;
    });
};

module.exports = crawl;
