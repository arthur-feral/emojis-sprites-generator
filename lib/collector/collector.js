import {
  PARSER_FOUND_MODIFIERS,
  PARSER_PARSE_CATEGORIES_SUCCESS,
  PARSER_PARSE_CATEGORY_SUCCESS,
  PARSER_PARSE_EMOJI_SUCCESS,
} from '../constants';
import logger from '../logger';

export default (config, emitter) => {
  let emojisTotal = 0;
  let categoriesTotal = 0;
  let categoriesScrapped = 0;
  let emojisScrapped = 0;

  emitter.on(PARSER_PARSE_CATEGORIES_SUCCESS, (categories) => {
    categoriesTotal += categories.length;
    logger.sameLine(`[Collector] Fetched ${categoriesScrapped}/${categoriesTotal} (${Math.ceil(categoriesScrapped / categoriesTotal * 100)}%) # ${emojisScrapped}/${emojisTotal} (${Math.ceil(emojisScrapped / emojisTotal * 100)}%)...`);
  });
  emitter.on(PARSER_FOUND_MODIFIERS, (category, emojis) => {
    emojisTotal += emojis.length;
  });

  emitter.on(PARSER_PARSE_CATEGORY_SUCCESS, (category, emojis) => {
    emojisTotal += emojis.length;
    categoriesScrapped += 1;
  });

  emitter.on(PARSER_PARSE_EMOJI_SUCCESS, (category, emoji) => {
    emojisScrapped += 1;

    logger.sameLine(`[Collector] Categories: ${categoriesScrapped}/${categoriesTotal} (${Math.ceil(categoriesScrapped / categoriesTotal * 100)}%) # Emojis: ${emojisScrapped}/${emojisTotal} (${Math.ceil(emojisScrapped / emojisTotal * 100)}%)...`);
  });
};
