'use strict';

const fs = require('fs');
const _ = require('lodash');
const superagent = require('superagent');
const when = require('when');
const gm = require('gm');
const cheerio = require('cheerio');
const Throttle = require('superagent-throttle');

let throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 50,          // how many requests can be sent every `ratePer`
  ratePer: 25,   // number of ms in which `rate` requests may be sent
  concurrent: 10     // how many requests can be sent concurrently
});

const emojipediaMainUrl = 'http://emojipedia.org';
const cachePath = '/tmp/cache';

let imagesDone = 0;
let imagesRequest = [];

let themesAvailables = [];
const allThemes = ['apple', 'emoji-one', 'emojidex', 'emojipedia', 'facebook', 'google', 'htc', 'lg', 'microsoft', 'mozilla', 'samsung', 'twitter', 'whatsapp'];

let emojisScrapped = 0;
let extraEmojisScrapped = 0;

/**
 * Get images from emojis themes data
 * @param config
 * @param datas
 * @returns {Promise}
 */
const scrapImages = (config, datas) => {

  // return when.resolve(allThemes);

  imagesDone = 0;
  imagesRequest = [];
  themesAvailables = [];

  try {
    fs.accessSync(`${config.destination}/images`, fs.F_OK);
  } catch (error) {
    fs.mkdirSync(`${config.destination}/images`);
  }
  _.each(datas, (category) => {
    _.each(category.emojis, (emoji) => {
      _.each(emoji.themes, (url, themeName) => {
        if (themesAvailables.indexOf(themeName) === -1) {
          themesAvailables.push(themeName);
        }
        imagesRequest.push(when.promise((resolve, reject) => {
          let themePath = `${`${config.destination}/images`}/${themeName}`;
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
              const pngPath = `${emojiPath}/${emoji.shortname}.png`;
              fs.writeFile(pngPath, result.body, function(error) {
                if (error) {
                  console.log('error', error);
                  reject(error);
                }
                gm(pngPath).trim().resize(null, config.size).write(pngPath, function(error) {
                  if (error) {
                    reject(error);
                  }
                  process.stdout.write(imagesDone + ' images processed \r');
                  resolve(`${pngPath} done.`);
                });
              });
            });
        }));
      });
    });
  });

  console.log(`getting ${imagesRequest.length} images...`);
  return when.all(imagesRequest).spread(function() {
    console.log(`${imagesDone} images writen \n`);
    return themesAvailables;
  });
};

/**
 * save html file
 * @param content
 * @param path
 * @param name
 */
const saveHtmlPage = (content, path, name) => {
  try {
    fs.accessSync(path, fs.F_OK);
  } catch (error) {
    fs.mkdirSync(path);
  }
  fs.writeFileSync(`${path}/${name}`, content);
};

/**
 * save the main page
 * @returns {*|Promise}
 */
const scrapIndex = () => {
  return when.promise((resolve, reject) => {
    superagent.get(emojipediaMainUrl)
      .use(throttle.plugin())
      .end((error, result) => {
        if (error) {
          reject(error);
        }
        try {
          saveHtmlPage(result.text, cachePath, 'index.html');
        } catch (error) {
          reject(error);
        }

        let $ = cheerio.load(result.text);
        const $categoriesBlock = $('div.sidebar div.block').first();
        if ($categoriesBlock.find('h2').text() !== 'Categories') {
          throw new Error('Html structure has changed, need update');
        }

        const categoryUrls = [];
        $categoriesBlock.find('a').each(function() {
          categoryUrls.push($(this).attr('href'));
        });

        if (!categoryUrls.length) {
          throw new Error('No categoryUrls found');
        }

        resolve(categoryUrls);
      });
  });
};

/**
 * save the categories pages
 * @param urls
 * @returns {*|Promise}
 */
const scrapCategoryPages = (urls) => {
  let categoriesScrapped = 0;
  return when.all(_.map(urls, (url) => {
    return when.promise((resolve, reject) => {
      superagent.get(`${emojipediaMainUrl}${url}`)
        .use(throttle.plugin())
        .end((error, result) => {
          if (error) {
            reject(error);
          }
          try {
            saveHtmlPage(result.text, cachePath, `${url.replace(/\//g, '')}.html`);
          } catch (error) {
            reject(error);
          }
          categoriesScrapped++;
          process.stdout.write(categoriesScrapped + ' categories scrapped \r');

          let $ = cheerio.load(result.text);

          const $emojisList = $('.emoji-list');
          const $links = $emojisList.find('a');

          if (!$links.length) {
            reject(new Error('Error parsing emojis list'));
          }

          let emojis = [];
          $links.each(function() {
            emojis.push($(this).attr('href'));
          });

          resolve(emojis);
        });
    });
  }));
};

/**
 * save the emojis pages
 * @param urls
 * @returns {Promise}
 */
const scrapEmojiPages = (urls) => {
  console.log('\n');
  urls = _.flatten(urls);
  return when.all(_.map(urls, (url) => {
    return when.promise((resolve, reject) => {
      superagent.get(`${emojipediaMainUrl}${url}`)
        .use(throttle.plugin())
        .end((error, result) => {
          if (error) {
            reject(error);
          }
          try {
            saveHtmlPage(result.text, cachePath, `${url.replace(/\//g, '')}.html`);
          } catch (error) {
            reject(error);
          }
          emojisScrapped++;
          process.stdout.write(emojisScrapped + ' emojis scrapped \r');

          // Get modifiers
          let $ = cheerio.load(result.text);
          let $article = $('article');
          let extraEmojis = [];
          const $modifiersList = $article.find('section.modifiers');
          if ($modifiersList.length) {
            let $modifiers = $modifiersList.find('a');
            $modifiers.each(function() {
              extraEmojis.push($(this).attr('href'));
            });
          }

          resolve(extraEmojis);
        });
    });
  })).spread(function() {
    console.log(`${emojisScrapped.length} saved`);
    let extraUrl = _.flatten(arguments);
    console.log(`getting ${extraUrl.length} emojis with modifiers`);
    return when.all(_.map(extraUrl, (url) => {
      return when.promise((resolve, reject) => {
        superagent.get(`${emojipediaMainUrl}${url}`)
          .use(throttle.plugin())
          .end((error, result) => {
            if (error) {
              reject(error);
            }
            try {
              saveHtmlPage(result.text, cachePath, `${url.replace(/\//g, '')}.html`);
            } catch (error) {
              reject(error);
            }
            extraEmojisScrapped++;
            process.stdout.write(extraEmojisScrapped + ' extra emojis scrapped \r');
          });
      });
    }));
  });
};

/**
 * scrap emojipedia website
 */
const scrap = () => {
  console.log('caching webpages...');
  return scrapIndex()
    .then(scrapCategoryPages)
    .then(scrapEmojiPages)
    .finally(() => {
      console.log('Done');
    });
};

module.exports = {
  scrap,
  scrapImages
};
