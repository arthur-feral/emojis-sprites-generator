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

module.exports = (superagent, {crawlIndexPage, crawlCategoryPages, crawlEmojisPages}) => {
  /**
   * get actegories list from html page
   * @returns {*|Promise}
   */
  const scrapIndex = (config) => {
    return when.promise((resolve, reject) => {
      if (config.fromCache) {
        fs.readFile(`${cachePath}/index.html`, 'utf8', (error, content) => {
          if (error) {
            reject(error);
          }

          resolve(crawlIndexPage(content));
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
            resolve(crawlIndexPage(result.text));
          });
      }
    });
  };

  /**
   * get categories datas from html page
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

            resolve(crawlCategoryPages(category, content));
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
   * @param config
   * @param emoji
   * @param index
   * @param isModifier
   * @returns {*|Promise}
   */
  const scrapEmojiPage = (config, emoji, index, isModifier) => {
    return when.promise((resolve, reject) => {
      if (config.fromCache) {
        fs.readFile(`${cachePath}/${category.name}/${emoji.shortname}.html`, 'utf8', (error, content) => {
          if (error) {
            reject(error);
          }
          resolve(crawlEmojisPages(emoji, index, content, isModifier));
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
            resolve(crawlEmojisPages(emoji, index, result.text, isModifier));
          });
      }
    });
  };

  /**
   * save the emojis pages (simple emojis and modifiers)
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
      console.log(`${arguments.length} saved`);
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
        console.log(`Loading ${config.destination}/emojis.json...`);
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

      console.log(`getting ${imagesRequests.length} images...`);
      resolve(
        when.all(imagesRequests).spread(function() {
          console.log(`${imagesDone} images writen \n`);
          return themesAvailables;
        })
      );
    });
  };


  return {
    scrap,
    scrapImages
  };
};
