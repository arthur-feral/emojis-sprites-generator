'use strict';

const fs = require('fs-extra');
const os = require('os');
const _ = require('lodash');
const when = require('when');
const Throttle = require('superagent-throttle');

let throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 50,          // how many requests can be sent every `ratePer`
  ratePer: 25,   // number of ms in which `rate` requests may be sent
  concurrent: 10     // how many requests can be sent concurrently
});

const emojipediaMainUrl = 'http://emojipedia.org';
// const cachePath = os.tmpdir();
const cachePath = [process.cwd(), 'cache'].join('/');

let imagesFetched = 0;
let imagesRequests = [];

let themesAvailables = [];
const allThemes = ['apple', 'emoji-one', 'emojidex', 'emojipedia', 'facebook', 'google', 'htc', 'lg', 'microsoft', 'mozilla', 'samsung', 'twitter', 'whatsapp'];

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
 * This module is the scrapping job part
 * we scrap datas from html pages
 * @param superagent
 * @param crawler
 * @param utils
 * @param logger
 * @returns {{scrapIndex: (function(boolean)), scrapCategories: (function(boolean, *=)), scrapEmojiPage: (function(*=, *=, *=, *=)), scrapEmojis: (function(boolean, *=)), scrap: (function(*)), scrapImages: (function(*=, *=)), scrapImage: (function(*=, *=, *, *, *))}}
 */
module.exports = (superagent, crawler, utils, logger) => {
  const crawlIndexPage = crawler.crawlIndexPage;
  const crawlCategoryPages = crawler.crawlCategoryPages;
  const crawlEmojisPages = crawler.crawlEmojisPages;
  const reduceDatas = utils.reduceDatas;

  /**
   * get actegories list from html page
   * @param {boolean} fromCache try to use cache instead of fetching from internet
   * @returns {*|Promise}
   */
  const scrapIndex = (fromCache) => {
    return when.promise((resolve, reject) => {
      let indexContent = null;
      if (fromCache) {
        try {
          indexContent = fs.readFileSync(`${cachePath}/index.html`, 'utf8');
        } catch (e) {
          indexContent = null;
        }
      }
      if (indexContent) {
        resolve(crawlIndexPage(indexContent));
      } else {
        superagent.get(emojipediaMainUrl)
          .end((error, result) => {
            if (error) {
              reject(error);
            }

            try {
              saveHtmlPage(result.text, cachePath, 'index.html');
            } catch (error) {
              reject(error);
            }
            resolve(crawlIndexPage(result.text));
          });
      }
    }).catch((error) => {
      logger.error(`[scrapIndex] Error while scrapping index page: ${error.message}`);
    });
  };

  /**
   * get categories datas from html page
   * @param {boolean} fromCache try to use cache instead of fetching from internet
   * @param categories
   * @returns {*|Promise}
   */
  const scrapCategories = (fromCache, categories) => {
    return when.all(_.map(categories, (category) => {
      return when.promise((resolve, reject) => {
        let categoryContent = null;
        if (fromCache) {
          try {
            categoryContent = fs.readFileSync(`${cachePath}/${category.name}.html`, 'utf8');
          } catch (e) {
            categoryContent = null;
          }
        }
        if (categoryContent) {
          resolve(crawlCategoryPages(category, categoryContent));
        } else {
          let request = superagent.get(`${emojipediaMainUrl}${category.url}`);
          if (process.env.NODE_ENV !== 'test') {
            request.use(throttle.plugin());
          }
          request.end((error, result) => {
            if (error) {
              reject(error);
            }
            try {
              saveHtmlPage(result.text, `${cachePath}/`, `${category.name}.html`);
            } catch (error) {
              reject(error);
            }
            resolve(crawlCategoryPages(category, result.text));
          });
        }
      }).catch((error) => {
        logger.error(`[scrapCategories] Error while scrapping category ${category.name}: ${error.message}`);
      });
    })).spread(function() {
      return reduceDatas(arguments);
    });
  };

  /**
   * get emoji datas from html page
   * @param fromCache
   * @param emoji
   * @param index
   * @param isModifier
   * @returns {*|Promise}
   */
  const scrapEmojiPage = (fromCache, emoji, index, isModifier) => {
    return when.promise((resolve, reject) => {
      let emojiContent;
      if (fromCache) {
        try {
          emojiContent = fs.readFileSync(`${cachePath}/${emoji.category}/${emoji.shortname}.html`, 'utf8');
        } catch (e) {
          emojiContent = null;
        }
      }
      if (emojiContent) {
        resolve(crawlEmojisPages(emoji, index, emojiContent, isModifier));
      } else {
        let request = superagent.get(`${emojipediaMainUrl}${emoji.url}`);
        if (process.env.NODE_ENV !== 'test') {
          request.use(throttle.plugin());
        }
        request.end((error, result) => {
          if (error) {
            reject(error);
          }

          try {
            saveHtmlPage(result.text, `${cachePath}/${emoji.category}`, `${emoji.shortname}.html`);
          } catch (error) {
            reject(error);
          }
          resolve(crawlEmojisPages(emoji, index, result.text, isModifier));
        });
      }
    }).catch((error) => {
      logger.error(`[scrapEmojiPage] Error while scrapping emoji ${emoji.shortname}: ${error.message}`);
    });
  };

  /**
   * save the emojis pages (simple emojis and modifiers)
   * @param {boolean} fromCache
   * @param categories
   * @returns {Promise}
   */
  const scrapEmojis = (fromCache, categories) => {
    let emojis = _.flatten(_.map(categories, (category) => category.emojis));
    return when.all(_.map(emojis, (emoji, index) => {
      return scrapEmojiPage(fromCache, emoji, index, false);
    })).spread(function() {
      fullEmojis = _.flatten(arguments);
      extraEmojis = _.chain(fullEmojis)
        .filter((fullEmoji) => _.has(fullEmoji, 'modifiers'))
        .map((fullEmoji) => fullEmoji.modifiers)
        .flatten().value();
      logger.success(`${arguments.length} emojis done. `);
      logger.info(`getting ${extraEmojis.length} emojis with modifiers  `);
      return when.all(_.map(extraEmojis, (extraEmoji, index) => {
        return scrapEmojiPage(fromCache, extraEmoji, index, true);
      })).spread(function() {
        _.chain(fullEmojis)
          .filter((fullEmoji) => _.has(fullEmoji, 'modifiers'))
          .each((fullEmoji) => {
            fullEmoji.modifiers = _.filter(_.flatten(arguments), (modifier) => modifier.index === fullEmoji.index)
          }).value();
        _.each(categories, (category) => {
          category.emojis = {};
        });
        _.each(fullEmojis, (fullEmoji) => {
          categories[fullEmoji.category].emojis[fullEmoji.shortname] = fullEmoji;
        });
        logger.success('Successfully scraped all emojis');

        return categories;
      });
    }).catch(logger.error);
  };

  /**
   * scrap emojipedia website
   */
  const scrap = (config) => {
    if (config.fromCache) {
      try {
        logger.info(`Loading ${config.destination}/emojis.json... `);
        const datas = fs.readFileSync(`${config.destination}/emojis.json`, 'utf8');
        return when.resolve(JSON.parse(datas));
      } catch (error) {
        logger.warn(`Cannot find emojis.json Crawling datas... `);
      }
    }
    return scrapIndex(config.fromCache)
      .then((categories) => {
        logger.info('\n');
        return scrapCategories(config.fromCache, categories);
      })
      .then((categories) => {
        logger.info('\n');
        return scrapEmojis(config.fromCache, categories);
      })
      .then((datas) => {
        logger.info('\n');
        logger.warn('Removing duplicates...');

        // some emojis with same shortname are dispatched in some categories
        // it brings css classnames collisions and falsy positions...
        let shortnames = [];
        let datasClean = _.cloneDeep(datas);
        _.each(datasClean, (category => {
          datasClean[category.name].emojis = _.chain(category.emojis)
            .filter((emoji) => {
              if (_.indexOf(shortnames, emoji.shortname) === -1) {
                shortnames.push(emoji.shortname);
                return true;
              } else {
                return false;
              }
            })
            .orderBy('index')
            .value();
        }));

        fs.mkdirpSync(config.destination);
        fs.writeFileSync(`${config.destination}/emojis.json`, JSON.stringify(datasClean), 'utf8');
        logger.success(`Successfully writen emojis json file. `);

        return datasClean;
      });
  };

  /**
   * scrap an image from an url and save it into cache folder
   * @param fromCache
   * @param url
   * @param theme
   * @param category
   * @param name
   * @returns {*|Promise}
   */
  const scrapImage = (fromCache, url, theme, category, name) => {
    return when.promise((resolve, reject) => {
      let imageFolder = `${cachePath}/images/${theme}/${category}`;
      let imagePath = `${imageFolder}/${name}_raw.png`;
      let imageExist = false;
      if (fromCache) {
        try {
          fs.accessSync(imagePath);
          imageExist = true;
        } catch (e) {
          imageExist = false;
        }
      }
      if (imageExist) {
        imagesFetched++;
        logger.count(`${imagesFetched} fetched`);
        resolve(imagePath);
      } else {
        let request = superagent.get(url);
        if (process.env.NODE_ENV !== 'test') {
          request.use(throttle.plugin());
        }

        request.end((error, result) => {
          if (error || !result.body) {
            reject(error);
          }

          fs.mkdirpSync(imageFolder);

          fs.writeFile(imagePath, result.body, function(error) {
            if (error) {
              reject(error);
            }
            imagesFetched++;
            logger.count(`${imagesFetched} fetched`);
            resolve(imagePath);
          });
        });
      }
    }).catch((error) => {
      logger.error(`[scrapImage] An error as occured while getting ${url}: ${error.message}`)
    });
  };

  /**
   * scrap images from website and save it into cache folder for processing later
   * @param config
   * @param datas
   * @returns {Promise}
   */
  const scrapImages = (config, datas) => {
    imagesRequests = [];

    fs.mkdirpSync(`${cachePath}/images`);

    _.each(datas, (category) => {
      _.each(category.emojis, (emoji) => {
        _.each(emoji.themes, (url, themeName) => {
          if (themesAvailables.indexOf(themeName) === -1) {
            themesAvailables.push(themeName);
          }
          imagesRequests.push(scrapImage(config.fromCache, url, themeName, category.name, emoji.shortname));
        });
        if (_.has(emoji, 'modifiers')) {
          _.each(emoji.modifiers, (modifier) => {
            _.each(modifier.themes, (modifierImageUrl, modifierThemeName) => {
              imagesRequests.push(scrapImage(config.fromCache, modifierImageUrl, modifierThemeName, category.name, modifier.shortname));
            });
          });
        }
      });
    });

    logger.warn(`${imagesRequests.length} images to process... `);

    return when.all(imagesRequests).spread(function() {
      logger.success(`${arguments.length} images collected `);
      return [themesAvailables, _.map(arguments, arg => arg)];
    }).catch(logger.error);
  };


  return {
    scrapIndex,
    scrapCategories,
    scrapEmojiPage,
    scrapEmojis,
    scrap,
    scrapImages,
    scrapImage,
  };
};
