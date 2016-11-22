'use strict';

const _ = require('lodash');
const gm = require('gm');
const fs = require('fs');
const os = require('os');
const when = require('when');


module.exports = (logger) => {
  const lessGenerator = require('./lessGenerator');
  const imageGenerator = require('./imageGenerator')(logger);

  /**
   * generate emojis sprite resources
   * @param {object} config an object containing config
   * {
 *    {string} imagesPath path to emojis png folder,
 *    {object} json containing emojis list
 *    {string} destinationPath build folder destination (default current)
 *    {int} size size in px for emojis height sprite (default 48)
 * }
   */
  const generator = (config) => {
    const themeName = config.theme;
    const pathToEmojisImages = config.imagesPath;
    const categories = config.json;
    const destinationPath = config.destinationPath || process.cwd();
    const size = parseInt(config.size || 48, 10);
    const prefix = config.prefix || 'emoji';

    if (!pathToEmojisImages) {
      throw new Error('A valid path for emojis images is required');
    }

    if (!categories) {
      throw new Error('Missing emojis datas');
    }

    try {
      fs.accessSync(destinationPath, fs.F_OK);
    } catch (error) {
      fs.mkdirSync(destinationPath);
    }

    let lessFile = '';
    const spritePath = `${destinationPath}/${themeName}.png`;
    const lessPath = `${destinationPath}/${themeName}.less`;
    let emojisCount = 0;
    let sprite = null;
    let totalWidth = 0;
    _.each(categories, (category) => {
      _.each(category.emojis, (emoji) => {
        let imagePath = `${pathToEmojisImages}/${category.name}/${emoji.shortname}.png`;
        let dimensions = sizeOf(imagePath);
        if (!sprite) {
          sprite = gm(imagePath)
        } else {
          sprite.append(imagePath, true);
        }
        lessFile += lessGenerator.emoji(prefix, emoji.shortname, totalWidth);
        emojisCount++;
        totalWidth += dimensions.width;
      });
    });

    lessFile = [lessGenerator.base(prefix, spritePath, totalWidth, size), lessFile].join(os.EOL);

    return when.promise((resolve, reject) => {
      sprite
        .resize(totalWidth, size + 1)
        .write(spritePath, (error) => {
          if (error) {
            reject(error);
          }

          fs.writeFile(lessPath, lessFile, (err) => {
            if (err) {
              reject(err);
            }

            resolve();
          });
        });
    });
  };


  // const generateSprite = function(themeName, categories, size, destination) {
  //   return generator({
  //     imagesPath: `${cachePath}/images/${themeName}`,
  //     json: categories,
  //     destinationPath: `${destination}/${themeName}`,
  //     theme: themeName,
  //     size: size
  //   }).then(() => {
  //     let json = categories;
  //     _.each(json, (category) => {
  //       delete category.url;
  //       _.each(category.emojis, (emoji) => {
  //         delete emoji.url;
  //         delete emoji.themes;
  //       });
  //     });
  //     fs.writeFileSync(`${destination}/${themeName}/${themeName}.json`, JSON.stringify(json), 'utf8');
  //     logger.success(`Sprite generated for ${themeName}`);
  //   });
  // };



  return {
    generator
  };
};
