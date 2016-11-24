'use strict';

// const os = require('os');
// const cachePath = os.tmpdir();
const fs = require('fs-extra');
const cacheImages = [process.cwd(), 'cache', 'images'].join('/');
const _ = require('lodash');
const when = require('when');
const gm = require('gm');
const sizeOf = require('image-size');
const baseImagePath = `${cacheImages}/base.png`;
let imagesDone = 0;
let imageProcessing = 0;
const MAX_IMAGES_AT_TIME = 30;
let TIMEOUT = 500;
module.exports = (logger) => {

  /**
   * generate a transparent image with provided size
   * @param size
   * @returns {*|Promise}
   */
  const generateBaseImage = (size) => {
    return when.promise((resolve, reject) => {
      gm(`${__dirname}/base.png`)
        .resize(null, parseInt(size, 10))
        .write(baseImagePath, (imageError) => {
          if (imageError) {
            reject(imageError);
          }

          resolve(baseImagePath);
        });
    }).catch((error) => {
      logger.error(`[generateBaseImage] cannot generate base image: ${error.message}`);
    });
  };

  const processImage = (size, pngPath, destinationPath) => {
    return when.promise((resolve, reject) => {
      imageProcessing++;

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
              logger.count(`${imagesDone} images processed`);
              resolve(destinationPath);
            });
        });
    }).catch((error) => {
      logger.error(`[processImage] cannot generate image: ${error.message}`);
    }).finally(() => {
      imageProcessing--;
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
    let alreadyProcessed = false;
    try {
      const dims = sizeOf(destinationPath);
      if (dims.height === size) {
        alreadyProcessed = true;
        imagesDone++;
      }
    } catch (e) {
      logger.error(e)
    }

    if (alreadyProcessed) {
      return when.resolve(destinationPath);
    } else {
      if (imageProcessing < MAX_IMAGES_AT_TIME) {
        return processImage(size, pngPath, destinationPath);
      } else {
        return when.promise((resolve, reject) => {
          setTimeout(() => {
            resolve(generateImage(size, pngPath, destinationPath));
          }, TIMEOUT);
        });
      }
    }
  };

  /**
   * generate a sprite for a specified theme
   * @param {string} theme the theme name apple|messenger|...
   * @param {array} emojis the emojis list to use
   * @param {string} destination the destination path
   * @return {Promise}
   */
  const generateSprite = (theme, emojis, destination) => {
    return when.promise((resolve, reject) => {
      let sprite = null;
      _.chain(emojis).orderBy('index').each((emoji) => {
        let imagePath = `${cacheImages}/${theme}/${emoji.category}/${emoji.shortname}.png`;
        try {
          fs.accessSync(imagePath);
        } catch (e) {
          reject(new Error(`Cannot access to ${imagePath}`));
          return;
        }
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
        reject(new Error(`Probleme occured while generating sprite`));
        return;
      }

      fs.mkdirpSync(`${destination}/${theme}`);

      let spritePath = `${destination}/${theme}/${theme}.png`;
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
    }).catch((error) => {
      logger.error(`[generateSprite] cannot generate sprite: ${error.message}`);
    });
  };

  return {
    generateBaseImage,
    generateSprite,
    generateImage
  };
};
