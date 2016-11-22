'use strict';

const fs = require('fs');
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
const cachePath = os.tmpdir();

let imagesDone = 0;
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
            saveHtmlPage(result.text, `${cachePath}/${emoji.category}`, `${emoji.name}.html`);
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
    logger.info('\n');
    let emojis = _.flatten(_.map(categories, (category) => category.emojis));
    return when.all(_.map(emojis, (emoji, index) => {
      return scrapEmojiPage(forceCache, emoji, index, false);
    })).spread(function() {
      fullEmojis = _.flatten(arguments);
      extraEmojis = _.chain(fullEmojis)
        .filter((fullEmoji) => _.has(fullEmoji, 'modifiers'))
        .map((fullEmoji) => fullEmoji.modifiers)
        .flatten().value();
      logger.success(`${arguments.length} saved`);
      logger.info(`getting ${extraEmojis.length} emojis with modifiers`);
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
        logger.info(`Loading ${config.destination}/emojis.json...`);
        const datas = fs.readFileSync(`${config.destination}/emojis.json`, 'utf8');
        return when.resolve(JSON.parse(datas));
      } catch (error) {
        logger.warn('Cannot find emojis.json Crawling datas...');
      }
    }
    return scrapIndex(config.fromCache)
      .then((categories) => {
        return scrapCategories(config.fromCache, categories);
      })
      .then((categories) => {
        return scrapEmojis(config.fromCache, categories);
      })
      .then((datas) => {
        try {
          fs.accessSync(config.destination, fs.F_OK);
        } catch (error) {
          fs.mkdirSync(config.destination);
        }

        fs.writeFileSync(`${config.destination}/emojis.json`, JSON.stringify(datas), 'utf8');
        logger.success('Successfully writen emojis json file.');

        return datas;
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
            try {
              fs.accessSync(`${pngPath}.png`, fs.F_OK);
            } catch (e) {
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
            }
          });
        });
      });

      logger.info(`getting ${imagesRequests.length} images...`);
      resolve(
        when.all(imagesRequests).spread(function() {
          logger.success(`${imagesDone} images writen \n`);
          return themesAvailables;
        })
      );
    });
  };


  return {
    scrapIndex,
    scrapCategories,
    scrapEmojiPage,
    scrapEmojis,
    scrap,
    scrapImages
  };
};
