import {
  APP_START, COLLECTOR_COLLECT_DONE,
  ERROR,
  FETCHER_FETCH_IMAGE_SUCCESS, FILES_DONE,
  PARSER_PARSE_IMAGE_ERROR,
  PARSER_PARSE_IMAGE_SUCCESS,
} from '../constants';
import jimp from 'jimp';
import logger from '../logger';
import sizeOf from 'image-size';
import gm from 'gm';
import fs from 'fs-extra';

const tempPath = `${process.cwd()}/tmp`;
const imagesPath = `${tempPath}/images`;
const BASE_IMAGE_PATH = `${imagesPath}/base.png`;
const MAX_IMAGES_TO_PROCESS_AT_TIME = 30;

export default (config, emitter) => {
  const queueToProcess = [];
  let imagesProcessing = 0;

  /**
   *
   * @param {object} category
   * @param {object} emoji
   * @param {string} themeName
   * @param {buffer} imageContent
   * @return {*}
   */
  const generateImage = (category, emoji, themeName, imageContent) => {
    imagesProcessing += 1;
    let imageFolder = `${tempPath}/images/${themeName}/${category.name}`;
    let imagePath = `${imageFolder}/${emoji.shortname}.png`;
    let imageRawPath = `${imageFolder}/${emoji.shortname}_raw.png`;
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
      emitter.emit(PARSER_PARSE_IMAGE_SUCCESS, category, emoji, themeName, imagePath);
      return Promise.resolve(category, emoji, themeName, imagePath);
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
          emitter.emit(PARSER_PARSE_IMAGE_SUCCESS, category, emoji, themeName, imagePath);
        }).catch((error) => {
          logger.error('[GenerateImage]');
          logger.error(error.message);
          logger.error(error.stack);
          emitter.emit(PARSER_PARSE_IMAGE_ERROR, error, category, emoji, themeName, imageContent);
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

  const queueImageProcessing = (category, emoji, themeName, imageContent) => {
    if (imagesProcessing < MAX_IMAGES_TO_PROCESS_AT_TIME) {
      generateImage(category, emoji, themeName, imageContent);
    } else {
      queueToProcess.push([category, emoji, themeName, imageContent]);
    }
  };

  /**
   *
   * @param {object} data
   * @param {array} themes
   */
  const generateThemes = (data, themes) => {
    logger.sameLine('🌈 Generating themes files: ♻️');

    return new Promise.all(
      themes.map(
        theme => {

        },
      ),
    ).then(() => {
      logger.success('🌈 Generating themes files: ✅');
    });
  };

  //emitter.on(COLLECTOR_COLLECT_DONE, generateThemes);

  emitter.on(FETCHER_FETCH_IMAGE_SUCCESS, queueImageProcessing);
  emitter.on(PARSER_PARSE_IMAGE_SUCCESS, tryProcessing);
  emitter.on(PARSER_PARSE_IMAGE_ERROR, (error, category, emoji, themeName, imageContent) => {
    emitter.emit(ERROR, error);
    queueToProcess.push([category, emoji, themeName, imageContent]);
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
          emitter.emit(FILES_DONE);
        });
    }).catch((readError) => {
      emitter.emit(ERROR, readError);
    });
  });

  return {
    generateImage,
  };
};
