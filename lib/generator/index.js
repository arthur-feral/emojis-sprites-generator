'use strict';

const _ = require('lodash');
const gm = require('gm');
const fs = require('fs');
const os = require('os');
const when = require('when');
const chalk = require('chalk');

module.exports = (logger) => {
  const imageGenerator = require('./imageGenerator')(logger);
  const stylesheetGenerator = require('./stylesheetGenerator');

  /**
   * generate images
   * @param size
   * @param paths
   * @returns {Promise}
   */
  const generateImages = (size, paths) => {
    return imageGenerator.generateBaseImage(size)
      .then(() => {
        return when.all(_.map(paths, (path) => imageGenerator.generateImage(size, path, path.replace('_raw', '')))).catch(logger.error);
      });
  };

  /**
   * generate a theme
   * @param theme
   * @param datas
   * @param preproc
   * @param prefix
   * @param size
   * @param destination
   * @returns {*|Promise}
   */
  const generateTheme = (theme, datas, preproc, prefix, size, destination) => {
    let emojis = _.flatten(_.map(datas, (category) => category.emojis));
    return imageGenerator.generateSprite(theme, emojis, destination)
      .then((dimensions) => {
        if (!dimensions) {
          throw new Error('[generateTheme] sprite dimensions undefined');
        }

        return stylesheetGenerator.generate(theme, preproc, prefix, emojis, dimensions, destination);
      })
      .then(() => {
        _.each(datas, (category) => {
          delete category.url;
          _.each(category.emojis, (emoji) => {
            delete emoji.themes;
            if (_.has(emoji, 'modifiers')) {
              _.each(emoji.modifiers, (modifier) => {
                delete modifier.themes;
              });
            }
          });
        });
        fs.writeFileSync(`${destination}/${theme}/${theme}.json`, JSON.stringify(datas), 'utf8');
        logger.info(`${theme} theme ${chalk.green('done')}`);
      })
      .catch((error) => {
        logger.info(`${theme} theme ${chalk.red('fail')} ${error.message}`);
      });
  };

  /**
   * generate all available themes
   * @param {object} config
   * @param {object} datas
   * @param {array} availableThemes
   * @returns {Promise|Request|Promise.<TResult>|*}
   */
  const generateThemes = (config, datas, availableThemes) => {
    return when.all(_.map(availableThemes, (theme) => {
      let themeDatas = _.merge({}, datas);
      logger.info(`Generating ${theme} theme...`);
      _.each(datas, (category => {
        themeDatas[category.name].emojis = _.chain(category.emojis)
          .filter((emoji) => {
            if (_.has(emoji, 'modifiers')) {
              if (!_.has(emoji.modifiers, theme)) {
                delete emoji.modifiers;
              }
            }
            return _.has(emoji.themes, theme);
          })
          .orderBy('index')
          .value();
      }));

      return generateTheme(theme, themeDatas, config.preproc, config.prefix, config.size, config.destination);
    })).spread(function() {
      return arguments;
    }).catch(logger.error);
  };

  return {
    generateThemes,
    generateTheme,
    generateImages
  };
};
