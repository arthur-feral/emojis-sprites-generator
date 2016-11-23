'use strict';

const _ = require('lodash');
const gm = require('gm');
const fs = require('fs');
const os = require('os');
const when = require('when');
const chalk = require('chalk');

module.exports = (logger) => {
  const lessGenerator = require('./lessGenerator');
  const imageGenerator = require('./imageGenerator')(logger);
  let message = [];
  let messageDone = [];

  /**
   * generate images
   * @param size
   * @param paths
   * @returns {Promise}
   */
  const generateImages = (size, paths) => {
    return when.all(_.map(paths, (path) => imageGenerator.generateImage(size, path, path.replace('_raw', ''))));
  };

  /**
   * generate a theme
   * @param theme
   * @param datas
   * @param prefix
   * @param size
   * @param destination
   * @returns {*|Promise}
   */
  const generateTheme = (theme, datas, prefix, size, destination) => {
    let emojis = _.flatten(_.map(datas, (category) => category.emojis));
    return imageGenerator.generateSprite(theme, emojis, destination)
      .then((dimensions) => {
        return lessGenerator.generate(theme, prefix, emojis, dimensions, destination);
      })
      .then(() => {
        fs.writeFileSync(`${destination}/${theme}/${theme}.json`, JSON.stringify(datas), 'utf8');
        messageDone.push(`${theme} theme ${chalk.green('done')}`);
      })
      .catch((error) => {
        messageDone.push(`${theme} theme ${chalk.red('fail')}`);
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
    return imageGenerator.generateBaseImage(config.size)
      .then(() => {
        let promise = when.all(_.map(availableThemes, (theme) => {
          message.push(`Generating ${theme} theme...`);
          let themeEmojis = {};
          _.each(datas, (category => {
            themeEmojis[category.name].emojis = _.sortBy(_.filter(category.emojis, (emoji) => _.has(emoji.themes, theme)), 'index');
          }));

          return generateTheme(theme, themeEmojis, config.prefix, config.size, config.destination);
        }));

        message.push('\r');
        logger.info(message.join('\n'));

        return promise;
      })
      .then(() => {
        messageDone.push('\r');
        logger.info(messageDone.join('\n'));

      });
  };

  return {
    generateThemes,
    generateTheme,
    generateImages
  };
};
