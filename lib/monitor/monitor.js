import {
  keys,
  size,
} from 'lodash';
import {
  ERROR,
  PARSER_FOUND_MODIFIERS,
  PARSER_PARSE_CATEGORIES_SUCCESS,
  PARSER_PARSE_CATEGORY_SUCCESS,
  PARSER_PARSE_EMOJI_SUCCESS,
  PARSER_PARSE_IMAGE_SUCCESS,
  PARSER_PARSED_ALL_IMAGES,
  PARSER_THEMES_FOUND,

  FETCHER_FETCH_CATEGORIES_ERROR,
  FETCHER_FETCH_CATEGORY_ERROR,
  FETCHER_FETCH_EMOJI_ERROR,
  FETCHER_FETCH_IMAGE_ERROR,
  PARSER_PARSE_CATEGORIES_ERROR,
  PARSER_PARSE_CATEGORY_ERROR,
  PARSER_PARSE_EMOJI_ERROR,
  PARSER_PARSE_IMAGE_ERROR,
  APP_START,
  APP_FILES_SPACE_READY,
  COLLECTOR_COLLECT_DONE,
  GENERATOR_SPRITE_ERROR,
} from '../constants';
import logger from '../logger';

export default (config, emitter) => {
  let emojisTotal = 0;
  let imagesTotal = 0;
  let imagesComputed = 0;
  let categoriesTotal = 0;
  let categoriesScrapped = 0;
  let emojisScrapped = 0;

  const printProgress = () => {
    let toLog = `# Categories ${categoriesScrapped}/${categoriesTotal} - ${Math.floor(categoriesScrapped / categoriesTotal * 100)}%`;
    toLog += ` # Emojis ${emojisScrapped}/${emojisTotal} - ${Math.floor(emojisScrapped / emojisTotal * 100)}%`;
    toLog += ` # Images ${imagesComputed}/${imagesTotal} - ${Math.floor(imagesComputed / imagesTotal * 100)}%`;

    logger.sameLine(toLog);
  };

  emitter.on(PARSER_PARSE_CATEGORIES_SUCCESS, (categories) => {
    categoriesTotal += categories.length;
    printProgress();
  });
  emitter.on(PARSER_FOUND_MODIFIERS, (emojis) => {
    emojisTotal += size(emojis);
    printProgress();
  });

  emitter.on(PARSER_PARSE_CATEGORY_SUCCESS, (emojis) => {
    emojisTotal += emojis.length;
    categoriesScrapped += 1;
  });

  emitter.on(PARSER_PARSE_EMOJI_SUCCESS, () => {
    emojisScrapped += 1;
  });

  emitter.on(PARSER_THEMES_FOUND, (images) => {
    imagesTotal += size(images);
    printProgress();
  });

  emitter.on(PARSER_PARSE_IMAGE_SUCCESS, (emoji, themeName, imagePath) => {
    imagesComputed += 1;
    printProgress();
    if (emojisTotal === emojisScrapped && imagesTotal === imagesComputed) {
      emitter.emit(PARSER_PARSED_ALL_IMAGES);
      logger.info('\n');
      logger.success('📡 Collecting data: ✅');
    }
  });

  const printError = (error) => {
    logger.error(error.message);
    logger.error(error.stack);
  };

  emitter.on(FETCHER_FETCH_CATEGORIES_ERROR, printError);
  emitter.on(FETCHER_FETCH_CATEGORY_ERROR, printError);
  emitter.on(FETCHER_FETCH_EMOJI_ERROR, printError);
  emitter.on(FETCHER_FETCH_IMAGE_ERROR, printError);
  emitter.on(PARSER_PARSE_CATEGORIES_ERROR, printError);
  emitter.on(PARSER_PARSE_CATEGORY_ERROR, printError);
  emitter.on(PARSER_PARSE_EMOJI_ERROR, printError);
  emitter.on(PARSER_PARSE_IMAGE_ERROR, printError);
  emitter.on(GENERATOR_SPRITE_ERROR, printError);

  emitter.on(ERROR, printError);
};
