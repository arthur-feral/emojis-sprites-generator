import {
  FETCHER_FETCH_IMAGE_SUCCESS,
  PARSER_PARSE_IMAGE_ERROR,
  PARSER_PARSE_IMAGE_SUCCESS,
} from '../constants';
import jimp from 'jimp';
import logger from '../logger';
import sizeOf from 'image-size';
import gm from 'gm';

const tempPath = `${process.cwd()}/tmp`;
const imagesPath = `${tempPath}/images`;
const BASE_IMAGE_PATH = `${imagesPath}/base.png`;
const MAX_IMAGES_TO_PROCESS_AT_TIME = 30;
const TIMEOUT = 500;

export default (config, emitter) => {
  const queueToProcess = [];
  let imagesProcessing = 0;

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
      return jimp.read(imageRawPath).then((image) => {
        image
          .autocrop()
          .write(imagePath, (error) => {
            if (error) {
              emitter.emit(PARSER_PARSE_IMAGE_ERROR, error, category, emoji, themeName, imageContent);
            }
            gm(imageRawPath)
              .resize(null, config.size)
              .write(imagePath, (error) => {
                if (error) {
                  emitter.emit(PARSER_PARSE_IMAGE_ERROR, error, category, emoji, themeName, imageContent);
                }
                const dimensions = sizeOf(imagePath);
                const x = Math.round((config.size - dimensions.width) / 2);

                gm(BASE_IMAGE_PATH)

                // add the emoji image into the base transparent image centered
                  .draw(`image Over ${x},0 0,0 ${imagePath}`)
                  .write(imagePath, function (err) {
                    if (err) {
                      emitter.emit(PARSER_PARSE_IMAGE_ERROR, error, category, emoji, themeName, imageContent);
                    }

                    imagesProcessing -= 1;
                    emitter.emit(PARSER_PARSE_IMAGE_SUCCESS, category, emoji, themeName, imagePath);
                  });
              });
          });
      }).catch((error) => {
        logger.error(error.message);
        emitter.emit(PARSER_PARSE_IMAGE_ERROR, error, category, emoji, themeName, imageContent);
      });
    }
  };

  const tryProcessing = () => {
    if (imagesProcessing < MAX_IMAGES_TO_PROCESS_AT_TIME) {
      if (queueToProcess.length) {
        generateImage.apply(null, queueToProcess.pop());
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

  emitter.on(FETCHER_FETCH_IMAGE_SUCCESS, queueImageProcessing);
  emitter.on(PARSER_PARSE_IMAGE_SUCCESS, tryProcessing);
  emitter.on(PARSER_PARSE_IMAGE_ERROR, (error, category, emoji, themeName, imageContent) => {
    queueToProcess.push([category, emoji, themeName, imageContent]);
  });

  return {
    generateImage,
  };
};
