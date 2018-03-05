import {
  has,
  forEach,
  noop,
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
  GENERATOR_GENERATE_SPRITE_SUCCESS,
  GENERATOR_GENERATE_STYLE_SUCCESS,
  EXTENTIONS,
} from '../constants';
import jimp from 'jimp';
import logger from '../logger';
import sizeOf from 'image-size';
import gm from 'gm';
import fse from 'fs-extra';
import fs from 'fs';
import StylesGenerator from './stylesGenerator';

const Spritesmith = require('spritesmith');

const MAX_IMAGES_TO_PROCESS_AT_TIME = 30;

const TEMP_FILES_PATH = process.env.TEMP_FILES_PATH;
const IMAGES_PATH = `${TEMP_FILES_PATH}/images`;
const STYLES_PATH = `${TEMP_FILES_PATH}/styles`;
const BASE_IMAGE_PATH = `${IMAGES_PATH}/base.png`;

export default (config, emitter) => {
  const stylesGenerator = StylesGenerator(config, emitter);
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
    let imageFolder = `${TEMP_FILES_PATH}/images/${themeName}/${emoji.category}`;
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
   * @param {array} emojis
   */
  const generateSprite = (theme, emojis) => {
    return new Promise((resolve, reject) => {
      let emojisFilePath = emojis.map(emoji => (
        `${TEMP_FILES_PATH}/images/${theme}/${emoji.category}/${emoji.name}.png`
      ));

      Spritesmith.run({ src: emojisFilePath }, function handleResult(err, result) {
        if (err) {
          reject(err);
        }

        fs.writeFileSync(`${config.destination}/${theme}/${theme}.png`, result.image);
        resolve(result);
      });
    }).then((sprite) => {
      emitter.emit(GENERATOR_GENERATE_SPRITE_SUCCESS, theme, emojis, sprite);
    }).catch((error) => {
      emitter.emit(GENERATOR_SPRITE_ERROR, error);
    });
  };

  /**
   *
   * @param {string} theme
   * @param {array} emojis
   * @param {object} sprite
   */
  const generateStyle = (theme, emojis, sprite) => {
    return new Promise((resolve, reject) => {
      const styleFile = stylesGenerator(theme, emojis, sprite.properties, sprite.coordinates);
      const filePath = `${config.destination}/${theme}`;
      const fileName = `${theme}.${EXTENTIONS[config.preproc]}`;
      const completePath = `${filePath}/${fileName}`;

      try {
        fse.mkdirpSync(filePath);
        fs.writeFileSync(completePath, styleFile, 'utf8');
        resolve(completePath);
      } catch (error) {
        reject(error);
      }
    }).then((path) => {
      emitter.emit(GENERATOR_GENERATE_STYLE_SUCCESS, theme, path);
    }).catch((error) => {
      emitter.emit(ERROR, error);
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
  emitter.on(GENERATOR_GENERATE_SPRITE_SUCCESS, generateStyle);

  emitter.on(APP_START, () => {
    logger.sameLine('💾 Preparing files space: ♻️');
    fse.mkdirpSync(`${TEMP_FILES_PATH}/images/`);
    fse.mkdirpSync(`${TEMP_FILES_PATH}/html/`);
    fse.mkdirpSync(`${TEMP_FILES_PATH}/styles/`);
    jimp.read(`${process.cwd()}/res/base.png`).then((image) => {
      image
        .resize(parseInt(config.size, 10), parseInt(config.size, 10))
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
    generateStyle,
  };
};
