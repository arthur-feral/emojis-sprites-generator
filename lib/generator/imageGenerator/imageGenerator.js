'use strict';

// const os = require('os');
// const cachePath = os.tmpdir();
const fs = require('fs-extra');
const cacheImages = [process.cwd(), 'cache', 'images'].join('/');
const _ = require('lodash');
const when = require('when');
const gm = require('gm');
const jimp = require('jimp');
const sizeOf = require('image-size');
const baseImagePath = `${cacheImages}/base.png`;

// images prccessed count
let imagesDone = 0;

// images processing count
let imageProcessing = 0;

// number of parallel images to process
const MAX_IMAGES_AT_TIME = 30;

// timeout to add another processing into queue
let TIMEOUT = 500;

/**
 * image generator part
 * it contain all method for image processing
 * @param logger
 * @returns {{generateBaseImage: (function(*=)), generateSprite: (function(string, array, string)), generateImage: (function(int, string, string))}}
 */
module.exports = (logger) => {

  /**
   * generate a transparent image with provided size which will be used as simple sprite base for an emoji
   * @param size
   * @returns {*|Promise}
   */
  const generateBaseImage = (size) => {
    return when.promise((resolve, reject) => {
      jimp.read(`${__dirname}/base.png`).then((image) => {
        image
          .resize(parseInt(size, 10), parseInt(size, 10) + 1)
          .write(baseImagePath, (imageError) => {
            if (imageError) {
              reject(imageError);
            }

            resolve(baseImagePath);
          });
      }).catch((readError) => {
        reject(readError);
      });
    }).catch((error) => {
      logger.error(`[generateBaseImage] cannot generate base image: ${error.message}`);
    });
  };

  /**
   * this method use the generated base transparent image
   * then trim the raw emoji image (removing transparent pixels around the emoji) and then put it on the base image correctly centered
   * @param size
   * @param pngPath
   * @param destinationPath
   */
  const processImage = (size, pngPath, destinationPath) => {
    return when.promise((resolve, reject) => {
      imageProcessing++;
      jimp.read(pngPath).then((image) => {
        image
          .autocrop()
          .write(destinationPath, (error) => {
            if (error) {
              reject(error);
            }
            gm(pngPath)
              .resize(null, size)
              .write(destinationPath, (error) => {
                if (error) {
                  reject(error);
                }
                const dimensions = sizeOf(destinationPath);
                const x = Math.round((size - dimensions.width) / 2);

                gm(baseImagePath)

                // add the emoji image into the base transparent image centered
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
          });
      });
    }).catch((error) => {
      logger.error(`[processImage] cannot generate image: ${error.message}`);
    }).finally(() => {
      imageProcessing--;
    });
  };

  /**
   * first it checks if the image already exis before processing it
   * this method throttle the images processing
   * to avoid OOM errors
   * @param {int} size the height of the image
   * @param {string} pngPath path of the image to process
   * @param {string} destinationPath location where write the final image
   * @returns {*|Promise}
   */
  const generateImage = (size, pngPath, destinationPath) => {
    let alreadyProcessed = false;
    try {
      const dims = sizeOf(destinationPath);

      // there we found the image and did not throw error
      if (parseInt(dims.width, 10) === parseInt(size, 10)) {

        // image already processed
        alreadyProcessed = true;
        imagesDone++;
      }
    } catch (e) {
    }

    if (alreadyProcessed) {
      return when.resolve(destinationPath);
    } else {

      // Limits the number of process in parallel
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

      // we order emojis by index to respect common order in category
      _.chain(emojis).orderBy('index').each((emoji) => {
        let imagePath = `${cacheImages}/${theme}/${emoji.category}/${emoji.shortname}.png`;

        // we fail generating sprite if an image is missing
        // @todo maybe dont stop the process and just dont provide this particular emoji in the final json file
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
        reject(new Error(`Probleme occured while generating sprite ${theme}`));
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
      logger.error(`[generateSprite] Cannot generate sprite: ${error.message}`);
    });
  };

  return {
    generateBaseImage,
    generateSprite,
    generateImage
  };
};
