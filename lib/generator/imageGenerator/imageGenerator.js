'use strict';

// const os = require('os');
// const cachePath = os.tmpdir();
const fs = require('fs');
const cachePath = [process.cwd(), 'cache'].join('/');
const cacheImages = [process.cwd(), 'cache', 'images'].join('/');
const _ = require('lodash');
const when = require('when');
const gm = require('gm');
const sizeOf = require('image-size');
const baseImagePath = `${cachePath}/base.png`;
let imagesDone = 0;

module.exports = (logger) => {

  /**
   * generate a transparent image with provided size
   * @param size
   * @returns {*|Promise}
   */
  const generateBaseImage = (size) => {
    return when.promise((resolve, reject) => {
      gm(`${__dirname}/base.png`)
        .resize(null, parseInt(size, 10) + 1)
        .write(`${cachePath}/base.png`, (imageError) => {
          if (imageError) {
            reject(imageError);
          }
          logger.info('Computing images to process...');

          resolve(`${cachePath}/base.png`);
        });
    });
  };

  /**
   *
   * @param {int} size the height of the image
   * @param {string} pngPath path of the image to process
   * @param {string} destinationPath location where write the final image
   * @returns {*|Promise}
   */
  const generateImage = (size, pngPath, destinationPath) => {
    return when.promise((resolve, reject) => {
      gm(pngPath)
        .trim()
        .resize(null, size)
        .write(destinationPath, (error) => {
          if (error) {
            reject(error);
          }
          const dimensions = sizeOf(destinationPath);
          const x = Math.round((size - dimensions.width) / 2);

          gm(baseImagePath)
            .draw(`image Over ${x},0 0,0 ${destinationPath}`)
            .write(destinationPath, function(err) {
              if (err) {
                reject(err);
              }
              imagesDone++;
              logger.count(imagesDone + ' images processed');

              resolve(destinationPath);
            });
        });
    });
  };

  /**
   * generate a sprite for a specified theme
   * @param {string} theme the theme name apple|messenger|...
   * @param {array} emojis the emojis list to use
   * @param {string} destination the destination path
   * @return {promise}
   */
  const generateSprite = (theme, emojis, destination) => {
    return when.promise((resolve, reject) => {
      let sprite = null;
      _.chain(emojis).orderBy('index').each((emoji) => {
        let imagePath = `${cacheImages}/${theme}/${emoji.category}/${emoji.shortname}.png`;
        if (sprite === null) {
          sprite = gm(imagePath);
        } else {
          sprite.append(imagePath, true);
        }

        if (_.has(emoji, 'modifiers')) {
          _.chain(emoji.modifiers).orderBy('shortname').each((modifier) => {
            sprite.append(`${cacheImages}/${theme}/${modifier.category}/${modifier.shortname}.png`, true);
          }).value();
        }
      }).value();

      if (!sprite) {
        reject(new Error('Cannot'))
      }

      try {
        fs.accessSync(destination, fs.F_OK);
      } catch (error) {
        fs.mkdirSync(destination);
      }

      let spritePath = `${destination}/${theme}.png`;
      sprite.write(spritePath, (err) => {
        if (err) {
          reject(err);
        }
        let dimensions = sizeOf(spritePath);
        resolve({
          width: dimensions.width,
          height: dimensions.height
        });
      });
    });
  };

  return {
    generateBaseImage,
    generateSprite,
    generateImage
  };
};
