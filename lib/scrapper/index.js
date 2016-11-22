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

module.exports = (superagent, crawler, logger) => {
  const crawlIndexPage = crawler.crawlIndexPage;
  const crawlCategoryPages = crawler.crawlCategoryPages;
  const crawlEmojisPages = crawler.crawlEmojisPages;

  /**
   * get actegories list from html page
   * @param {boolean} forceCache try to use cache instead of fetching from internet
   * @returns {*|Promise}
   */
  const scrapIndex = (forceCache) => {
    return when.promise((resolve, reject) => {
      let indexContent = null;
      if (forceCache) {
        try {
          indexContent = fs.readFile(`${cachePath}/index.html`, 'utf8');
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
    });
  };

  /**
   * get categories datas from html page
   * @param {boolean} forceCache try to use cache instead of fetching from internet
   * @param categories
   * @returns {*|Promise}
   */
  const scrapCategories = (forceCache, categories) => {
    return when.all(_.map(categories, (category) => {
      return when.promise((resolve, reject) => {
        let categoryContent = null;
        if (forceCache) {
          try {
            categoryContent = fs.readFile(`${cachePath}/${category.name}.html`, 'utf8');
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
      });
    })).spread(function() {
      return reduceDatas(arguments);
    });
  };

  /**
   * get emoji datas from html page
   * @param forceCache
   * @param emoji
   * @param index
   * @param isModifier
   * @returns {*|Promise}
   */
  const scrapEmojiPage = (forceCache, emoji, index, isModifier) => {
    return when.promise((resolve, reject) => {
      let emojiContent;
      if (forceCache) {
        try {
          emojiContent = fs.readFile(`${cachePath}/${category.name}/${emoji.shortname}.html`, 'utf8');
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
    });
  };

  /**
   * save the emojis pages (simple emojis and modifiers)
   * @param {boolean} forceCache
   * @param categories
   * @returns {Promise}
   */
  const scrapEmojis = (forceCache, categories) => {
    let emojis = _.flatten(_.map(categories, (category) => category.emojis));
    return when.all(_.map(emojis, (emoji, index) => {
      return scrapEmojiPage(forceCache, emoji, index, false);
    })).spread(function() {
      fullEmojis = _.flatten(arguments);
      extraEmojis = _.chain(fullEmojis)
        .filter((fullEmoji) => _.has(fullEmoji, 'modifiers'))
        .map((fullEmoji) => fullEmoji.modifiers)
        .flatten().value();
      logger.success(`${arguments.length} emojis done. `);
      logger.info(`getting ${extraEmojis.length} emojis with modifiers  `);
      return when.all(_.map(extraEmojis, (extraEmoji, index) => {
        return scrapEmojiPage(forceCache, extraEmoji, index, true);
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

        try {
          fs.accessSync(config.destination, fs.F_OK);
        } catch (error) {
          fs.mkdirSync(config.destination);
        }

        fs.writeFileSync(`${config.destination}/emojis.json`, JSON.stringify(datas), 'utf8');
        logger.success(`Successfully writen emojis json file. `);

        return datas;
      });
  };

  /**
   *
   * @param forceCache
   * @param url
   * @param theme
   * @param category
   * @param name
   * @returns {*|Promise}
   */
  const scrapImage = (forceCache, url, theme, category, name) => {
    return when.promise((resolve, reject) => {
      let imageFolder = `${cachePath}/images/${theme}/${category}`;
      let imagePath = `${imageFolder}/${name}_raw.png`;
      if (forceCache) {
        try {
          fs.accessSync(imagePath);
          resolve(imagePath);
        } catch (e) {
          let request = superagent.get(url);
          if (process.env.NODE_ENV !== 'test') {
            request.use(throttle.plugin());
          }
          request.end((error, result) => {
            if (error) {
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
      }
    });
  };

  /**
   * Get images from emojis themes data
   * @param forceCache
   * @param datas
   * @returns {Promise}
   */
  const scrapImages = (forceCache, datas) => {
    //return when.resolve(allThemes);
    imagesRequests = [];
    themesAvailables = [];

    fs.mkdirpSync(`${cachePath}/images`);

    _.each(datas, (category) => {
      _.each(category.emojis, (emoji) => {
        _.each(emoji.themes, (url, themeName) => {
          if (themesAvailables.indexOf(themeName) === -1) {
            themesAvailables.push(themeName);
          }
          imagesRequests.push(scrapImage(forceCache, url, themeName, category, emoji.shortname));
        });
        if (_.has(emoji, 'modifiers')) {
          _.each(emoji.modifiers, (modifier) => {
            _.each(modifier.themes, (modifierImageUrl, modifierThemeName) => {
              imagesRequests.push(scrapImage(forceCache, modifierImageUrl, modifierThemeName, category, modifier.shortname));
            });
          });
        }
      });
    });

    logger.warn(`${imagesRequests.length} images to process... `);

    return when.all(imagesRequests).spread(function() {
      logger.success(`${arguments.length} images collected `);
      return themesAvailables;
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
