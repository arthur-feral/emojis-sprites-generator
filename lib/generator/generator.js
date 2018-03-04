import {
  has,
  forEach,
  size,
} from 'lodash';
import {
  APP_START,
  COLLECTOR_COLLECT_DONE,
  ERROR,
  FETCHER_FETCH_IMAGE_SUCCESS,
  GENERATOR_SPRITE_ERROR,
  APP_FILES_SPACE_READY,
  PARSER_PARSE_IMAGE_ERROR,
  PARSER_PARSE_IMAGE_SUCCESS,
} from '../constants';
import jimp from 'jimp';
import logger from '../logger';
import sizeOf from 'image-size';
import gm from 'gm';
import fs from 'fs-extra';

const tempPath = process.env.TEMP_IMAGES_PATH;
const imagesPath = `${tempPath}/images`;
const BASE_IMAGE_PATH = `${imagesPath}/base.png`;
const MAX_IMAGES_TO_PROCESS_AT_TIME = 30;

export default (config, emitter) => {
  const queueToProcess = [];
  let imagesProcessing = 0;

  /**
   *
   * @param {object} emoji
   * @param {string} themeName
   * @return {*}
   */
  const generateImage = (emoji, themeName) => {
    imagesProcessing += 1;
    let imageFolder = `${tempPath}/images/${themeName}/${emoji.category}`;
    let imagePath = `${imageFolder}/${emoji.name}.png`;
    let imageRawPath = `${imageFolder}/${emoji.name}_raw.png`;
    let alreadyProcessed = true;

    try {
      const dims = sizeOf(imagePath);

      // if we found the image but the dimensions are differents, then we process again
      if (parseInt(dims.width, 10) !== parseInt(config.size, 10)) {
        alreadyProcessed = false;
      }
    } catch (error) {
      alreadyProcessed = false;
    }

    if (alreadyProcessed) {
      emitter.emit(PARSER_PARSE_IMAGE_SUCCESS, emoji, themeName, imagePath);
      return Promise.resolve(emoji, themeName, imagePath);
    } else {
      return new Promise((resolve, reject) => {
        jimp.read(imageRawPath).then((image) => {
          image
            .autocrop()
            .write(imagePath, (writeBaseError) => {
              if (writeBaseError) {
                reject(writeBaseError);
              }

              gm(imageRawPath)
                .resize(null, config.size)
                .write(imagePath, (writeRawError) => {
                  if (writeRawError) {
                    reject(writeRawError);
                  }

                  const dimensions = sizeOf(imagePath);
                  const x = Math.round((config.size - dimensions.width) / 2);

                  gm(BASE_IMAGE_PATH)
                  // add the emoji image into the base transparent image centered
                    .draw(`image Over ${x},0 0,0 ${imagePath}`)
                    .write(imagePath, function (writeResultError) {
                      if (writeResultError) {
                        reject(writeResultError);
                      }

                      resolve();
                    });
                });
            });
        }).then(() => {
          emitter.emit(PARSER_PARSE_IMAGE_SUCCESS, emoji, themeName, imagePath);
        }).catch((error) => {
          logger.error('[GenerateImage]');
          logger.error(error.message);
          logger.error(error.stack);
          emitter.emit(PARSER_PARSE_IMAGE_ERROR, error, emoji, themeName);
        });
      });
    }
  };

  const tryProcessing = () => {
    imagesProcessing -= 1;

    if (imagesProcessing < MAX_IMAGES_TO_PROCESS_AT_TIME) {
      if (queueToProcess.length) {
        const args = queueToProcess.shift();
        generateImage.apply(null, args);
      }
    }
  };

  const queueImageProcessing = (emoji, themeName) => {
    if (imagesProcessing < MAX_IMAGES_TO_PROCESS_AT_TIME) {
      generateImage(emoji, themeName);
    } else {
      queueToProcess.push([emoji, themeName]);
    }
  };

  /**
   *
   * @param {string} theme
   * @param {object} emojis
   */
  const generateSprite = (theme, emojis) => {
    return new Promise((resolve, reject) => {
      let sprite;
      let emojisCount = size(emojis);
      let spriteSize = Math.floor(Math.sqrt(emojisCount));

      forEach(emojis, (emoji) => {
        let imageFolder = `${tempPath}/images/${theme}/${emoji.category}`;
        let imagePath = `${imageFolder}/${emoji.name}.png`;

        try {
          fs.accessSync(imagePath);
        } catch (error) {
          reject(error);
        }

        if (sprite === null) {
          sprite = gm(imagePath);
        } else {
          sprite.append(imagePath, true);
        }

        if (has(emoji, 'modifiers')) {
          forEach(emoji.modifiers, (modifier) => {
            sprite.append(`${imagesPath}/${theme}/${modifier.category}/${modifier.name}.png`, true);
          });
        }
      });


    }).then(() => {

    }).catch((error) => {
      emitter.emit(GENERATOR_SPRITE_ERROR, error);
    });
  };

  /**
   *
   * @param {object} emojis
   * @param {array} themes
   */
  const generateSprites = (emojis, themes) => {
    logger.sameLine('🌈 Generating themes files: ♻️');

    return new Promise.all(
      themes.map(
        theme => {
          let themeData = {};
          forEach(emojis, (emoji) => {
            if (has(emoji.themes, theme)) {
              themeData[theme] = {
                ...themeData[theme],
                [emoji.name]: emoji,
              };
            }
          });

          return generateSprite(theme, themeData);
        },
      ),
    ).then(() => {
      logger.success('🌈 Generating themes files: ✅');
    });
  };

  //emitter.on(COLLECTOR_COLLECT_DONE, generateSprites);

  emitter.on(FETCHER_FETCH_IMAGE_SUCCESS, queueImageProcessing);
  emitter.on(PARSER_PARSE_IMAGE_SUCCESS, tryProcessing);
  emitter.on(PARSER_PARSE_IMAGE_ERROR, (error, emoji, themeName) => {
    emitter.emit(ERROR, error);
    queueToProcess.push([emoji, themeName]);
  });

  emitter.on(APP_START, () => {
    logger.sameLine('💾 Preparing files space: ♻️');
    fs.mkdirpSync(`${tempPath}/images/`);
    fs.mkdirpSync(`${tempPath}/html/`);
    jimp.read(`${process.cwd()}/res/base.png`).then((image) => {
      image
        .resize(parseInt(config.size, 10), parseInt(config.size, 10) + 1)
        .write(BASE_IMAGE_PATH, (imageError) => {
          if (imageError) {
            emitter.emit(ERROR, imageError);
          }
          logger.success('💾 Preparing files space: ✅️');
          emitter.emit(APP_FILES_SPACE_READY);
        });
    }).catch((readError) => {
      emitter.emit(ERROR, readError);
    });
  });

  return {
    generateImage,
    generateSprite,
  };
};
