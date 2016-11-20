'use strict';

const fs = require('fs');
const _ = require('lodash');
const superagent = require('superagent');
const when = require('when');
const gm = require('gm');
const cheerio = require('cheerio');
const Throttle = require('superagent-throttle');
const sizeOf = require('image-size');

let throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 50,          // how many requests can be sent every `ratePer`
  ratePer: 25,   // number of ms in which `rate` requests may be sent
  concurrent: 10     // how many requests can be sent concurrently
});

const emojipediaMainUrl = 'http://emojipedia.org';
const cachePath = '/tmp/cache';

let imagesDone = 0;
let imagesRequests = [];

let themesAvailables = [];
const allThemes = ['apple', 'emoji-one', 'emojidex', 'emojipedia', 'facebook', 'google', 'htc', 'lg', 'microsoft', 'mozilla', 'samsung', 'twitter', 'whatsapp'];

let categoriesScrapped = 0;

let emojisScrapped = 0;
let extraEmojisScrapped = 0;
let extraEmojis = [];
let fullEmojis = [];

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

const getEmojiDatasFromHtml = (emojiRaw, html, isModifier) => {
  let emoji = _.merge({}, emojiRaw);
  // Get modifiers
  let $ = cheerio.load(html);
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

  if (!isModifier) {
    const $modifiersList = $article.find('section.modifiers');
    if ($modifiersList.length) {
      let $modifiers = $modifiersList.find('a');
      $modifiers.each(function(i) {
        const char = $(this).find('.emoji').text();
        const url = $(this).attr('href');
        $(this).find('.emoji').remove();
        const text = $(this).text().replace(/^ /, '');

        extraEmojis.push({
          url: url,
          shortname: url.replace(/\//g, ''),
          char: char,
          category: emoji.category,
          fullName: text,
          index: emoji.index
        });
      });
    }
    $article.find('section.modifiers').remove();
  }

  return emoji;
};

const scrapIndexPage = (resolve, html) => {
  let $ = cheerio.load(html);
  const $categoriesBlock = $('div.sidebar div.block').first();
  if ($categoriesBlock.find('h2').text() !== 'Categories') {
    throw new Error('Html structure has changed, need update');
  }

  const categories = [];
  $categoriesBlock.find('a').each(function() {
    $(this).find('.emoji').remove();
    const text = $(this).text().replace(/^ /g, '');
    const url = $(this).attr('href');
    categories.push({
      name: url.replace(/\//g, ''),
      url: url,
      fullName: text
    });
  });

  if (!categories.length) {
    throw new Error('No categories found');
  }

  resolve(categories);
};

/**
 * save the main page
 * @returns {*|Promise}
 */
const scrapIndex = (config) => {
  return when.promise((resolve, reject) => {
    if (config.fromCache) {
      fs.readFile(`${cachePath}/index.html`, 'utf8', (error, content) => {
        if (error) {
          reject(error);
        }

        scrapIndexPage(resolve, content);
      });
    } else {
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

          scrapIndexPage(resolve, result.text);
        });
    }
  });
};

const scrapCategoryPages = (category, resolve, html) => {
  categoriesScrapped++;
  process.stdout.write(categoriesScrapped + ' categories scrapped \r');

  const $ = cheerio.load(html);
  const $emojisList = $('.emoji-list');
  const $links = $emojisList.find('a');

  if (!$links.length) {
    reject(new Error('Error parsing emojis list'));
  }

  let emojis = [];
  $links.each(function() {
    const char = $(this).find('.emoji').text();
    const url = $(this).attr('href');
    $(this).find('.emoji').remove();
    const text = $(this).text().replace(/\//g, '');
    emojis.push({
      url: url,
      shortname: url.replace(/\//g, ''),
      char: char,
      category: category.name,
      fullName: text
    });
  });

  resolve({
    [category.name]: _.merge(category, {
      emojis: emojis
    })
  });
};

/**
 * save the categories pages
 * @param config
 * @param categories
 * @returns {*|Promise}
 */
const scrapCategories = (config, categories) => {
  return when.all(_.map(categories, (category) => {
    return when.promise((resolve, reject) => {
      if (config.fromCache) {
        fs.readFile(`${cachePath}/${category.name}.html`, 'utf8', (error, content) => {
          if (error) {
            reject(error);
          }

          scrapCategoryPages(category, resolve, content);
        });
      } else {
        superagent.get(`${emojipediaMainUrl}${category.url}`)
          .use(throttle.plugin())
          .end((error, result) => {
            if (error) {
              reject(error);
            }
            try {
              saveHtmlPage(result.text, `${cachePath}/`, `${category.name}.html`);
            } catch (error) {
              reject(error);
            }
            scrapCategoryPages(category, resolve, result.text);
          });
      }
    });
  })).spread(function() {
    return reduceDatas(arguments);
  });
};


const crawlEmojiPage = (emoji, index, resolve, html, isModifier) => {
  emoji = _.merge({
    themes: {},
  }, emoji);
  if (!isModifier) {
    emoji.index = index;
  }

  emoji = _.merge(emoji, getEmojiDatasFromHtml(emoji, html, isModifier));
  delete emoji.url;

  resolve(emoji);
};

const crawlEmojisPages = (emoji, index, resolve, html, isModifier) => {
  if (isModifier) {
    extraEmojisScrapped++;
    process.stdout.write(extraEmojisScrapped + ' extra emojis scrapped \r');
  } else {
    emojisScrapped++;
    process.stdout.write(emojisScrapped + ' emojis scrapped \r');
  }
  crawlEmojiPage(emoji, index, resolve, html, isModifier);
};

const scrapEmojiPage = (config, emoji, index, isModifier) => {
  return when.promise((resolve, reject) => {
    if (config.fromCache) {
      fs.readFile(`${cachePath}/${category.name}/${emoji.shortname}.html`, 'utf8', (error, content) => {
        if (error) {
          reject(error);
        }
        crawlEmojisPages(emoji, index, resolve, content, isModifier);
      });
    } else {
      superagent.get(`${emojipediaMainUrl}${emoji.url}`)
        .use(throttle.plugin())
        .end((error, result) => {
          if (error) {
            reject(error);
          }

          try {
            saveHtmlPage(result.text, `${cachePath}/${emoji.category}`, `${emoji.name}.html`);
          } catch (error) {
            reject(error);
          }
          crawlEmojisPages(emoji, index, resolve, result.text, isModifier);
        });
    }
  });
};

/**
 * save the emojis pages
 * @param config
 * @param categories
 * @returns {Promise}
 */
const scrapEmojis = (config, categories) => {
  console.log('\n');
  let emojis = _.flatten(_.map(categories, (category) => category.emojis));

  return when.all(_.map(emojis, (emoji, index) => {
    return scrapEmojiPage(config, emoji, index, false);
  })).spread(function() {
    fullEmojis = _.flatten(arguments);
    console.log(`${emojisScrapped} saved`);
    console.log(`getting ${extraEmojis.length} emojis with modifiers`);
    return when.all(_.map(extraEmojis, (extraEmoji, index) => {
      return scrapEmojiPage(config, extraEmoji, index, true);
    })).spread(function() {
      fullEmojis = fullEmojis.concat(_.flatten(arguments));
      _.each(categories, (category) => {
        category.emojis = {};
      });
      _.each(fullEmojis, (fullEmoji) => {
        categories[fullEmoji.category].emojis[fullEmoji.shortname] = fullEmoji;
      });

      return categories;
    });
  });
};

/**
 * scrap emojipedia website
 */
const scrap = (config) => {
  if (config.fromCache) {
    try {
      const datas = fs.readFileSync(`${config.destination}/emojis.json`, 'utf8');
      return when.resolve(JSON.parse(datas));
    } catch (error) {
      console.log('Cannot find emojis.json Crawling datas...');
    }
  }
  return scrapIndex(config)
    .then((categories) => {
      return scrapCategories(config, categories);
    })
    .then((categories) => {
      return scrapEmojis(config, categories);
    })
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

const generateImage = (config, pngPath, resolve, reject) => {
  gm(`${pngPath}_raw.png`)
    .trim()
    .resize(null, config.size)
    .write(`${pngPath}.png`, function(error) {
      if (error) {
        reject(error);
      }
      const dimensions = sizeOf(`${pngPath}.png`);
      const x = Math.round((config.size - dimensions.width) / 2);

      gm(`${cachePath}/base.png`)
        .draw(`image Over ${x},0 0,0 ${pngPath}.png`)
        .write(`${pngPath}.png`, function(err) {
          if (err) {
            reject(err);
          }
          imagesDone++;
          process.stdout.write(imagesDone + ' images processed \r');

          resolve();
        });
    });
};

/**
 * Get images from emojis themes data
 * @param config
 * @param datas
 * @returns {Promise}
 */
const scrapImages = (config, datas) => {

  //return when.resolve(allThemes);

  imagesDone = 0;
  imagesRequests = [];
  themesAvailables = [];

  try {
    fs.accessSync(`${cachePath}/images`, fs.F_OK);
  } catch (error) {
    fs.mkdirSync(`${cachePath}/images`);
  }

  return when.promise((resolve, reject) => {
    gm(`${__dirname}/base.png`)
      .resize(null, config.size)
      .write(`${cachePath}/base.png`, (imageError) => {
        if (imageError) {
          reject(imageError);
        }

        _.each(datas, (category) => {
          _.each(category.emojis, (emoji) => {
            _.each(emoji.themes, (url, themeName) => {
              const themePath = `${cachePath}/images/${themeName}`;
              const emojiPath = `${themePath}/${category.name}`;
              const pngPath = `${emojiPath}/${emoji.shortname}`;

              if (themesAvailables.indexOf(themeName) === -1) {
                themesAvailables.push(themeName);
                try {
                  fs.accessSync(themePath, fs.F_OK);
                } catch (error) {
                  fs.mkdirSync(themePath);
                }
              }
              imagesRequests.push(when.promise((resolveImage, rejectImage) => {
                try {
                  fs.readFileSync(`${pngPath}_raw.png`);
                  generateImage(config, pngPath, resolveImage, rejectImage);
                } catch (e) {
                  superagent.get(url)
                    .use(throttle.plugin())
                    .end((error, result) => {
                      if (error) {
                        reject(error);
                      }
                      try {
                        fs.accessSync(emojiPath, fs.F_OK);
                      } catch (error) {
                        fs.mkdirSync(emojiPath);
                      }
                      fs.writeFile(`${pngPath}_raw.png`, result.body, function(error) {
                        if (error) {
                          reject(error);
                        }

                        generateImage(config, pngPath, resolveImage, rejectImage);
                      });
                    });
                }
              }));
            });
          });
        });

        console.log(`getting ${imagesRequests.length} images...`);
        resolve(
          when.all(imagesRequests).spread(function() {
            console.log(`${imagesDone} images writen \n`);
            return themesAvailables;
          })
        );
      });
  });
};

module.exports = {
  scrap,
  scrapImages
};
