import fs from 'fs-extra';
import {
  reduce,
  omit,
  map,
  has,
  forEach,
  keys,
  size,
} from 'lodash';
import {
  PARSER_PARSE_CATEGORIES_SUCCESS,
  PARSER_PARSE_EMOJI_SUCCESS,
  PARSER_PARSE_IMAGE_SUCCESS,
  COLLECTOR_COLLECT_DONE,
  PARSER_THEMES_FOUND,
  PARSER_PARSED_ALL_IMAGES,
} from '../constants';
import logger from '../logger';
import { saveFile } from '../utils';

const tempPath = process.env.TEMP_FILES_PATH;
const jsonPath = `${tempPath}/json`;

/**
 * This module collect all data gathered by the fetcher and the parser
 * @param {object} config
 * @param {object} emitter
 * @return {{getEmojis: function(): {}, getThemes: function(): {}, getCategories: function(): {}, getData: function(): {}}}
 */
export default (config, emitter) => {
  let themes = {};
  let emojisTotal = 0;
  let emojisScrapped = 0;
  let imagesTotal = 0;
  let imagesComputed = 0;
  let data = {};
  let emojis = {};
  let categories = {};

  const getEmojis = () => emojis;
  const getThemes = () => themes;
  const getCategories = () => categories;
  const getData = () => data;

  /**
   * @description event handler
   * it catches all themes receptions when we parse an emoji page
   * @param {object} emojisThemesImages an hashmap containing images url for each themes for an emoji
   */
  const onThemesFound = (emojisThemesImages) => {
    forEach(emojisThemesImages, (url, themeName) => {
      if (!has(themes, themeName)) {
        themes[themeName] = themeName;
      }
    });
  };

  /**
   * @description event handler
   * It catches the newly parsed emoji from an html page and store it
   * @param {object} parsedEmoji
   */
  const onEmojiParsed = (parsedEmoji) => {
    emojisScrapped += 1;

    emojis = {
      ...emojis,
      [parsedEmoji.name]: omit(parsedEmoji, 'url'),
    };
  };

  /**
   * @description event handler
   * It catches the newly parsed categories from the html page
   * @param {array<object>} categoriesFound
   */
  const onCategoriesParsed = (categoriesFound) => {
    categories = reduce(categoriesFound, (result, category) => {
      return {
        ...result,
        [category.name]: category,
      };
    }, {});
    saveFile(JSON.stringify(getCategories()), `${jsonPath}`, 'categories.json');
  };

  const onImageParsed = (emoji, themeName, imagePath) => {
    imagesComputed += 1;

    if (emojisTotal === emojisScrapped && imagesTotal === imagesComputed) {
      emitter.emit(PARSER_PARSED_ALL_IMAGES);
      logger.info('\n');
      logger.success('📡 Collecting data: ✅');
    }
  };

  /**
   * HERE WE COLLECTED ALL DATA AND IMAGES WE NEED
   * we can clean the data and start building themes
   */
  const onParsedAllImages = () => {
    let dataClean = {};
    forEach(categories, (category) => {
      dataClean = {
        ...dataClean,
        [category.name]: category,
      };
    });

    forEach(emojis, (emoji) => {
      if (has(emoji, 'parent')) {
        emojis[emoji.parent]
          ['modifiers']
          [emoji.name] = emoji;

        dataClean
          [emoji.category]
          ['emojis']
          [emoji.parent]
          ['modifiers']
          [emoji.name] = omit(emoji, 'themes');
      } else {
        dataClean = {
          ...dataClean,
          [emoji.category]: {
            ...dataClean[emoji.category],
            emojis: {
              ...dataClean[emoji.category].emojis,
              [emoji.name]: omit(emoji, 'themes'),
            },
          },
        };
      }
    });

    fs.writeFileSync(`${config.destination}/emojis.json`, JSON.stringify(dataClean), 'utf8');

    emitter.emit(COLLECTOR_COLLECT_DONE, map(emojis, e => e), keys(themes));
  };

  emitter.on(PARSER_THEMES_FOUND, onThemesFound);
  emitter.on(PARSER_PARSE_EMOJI_SUCCESS, onEmojiParsed);
  emitter.on(PARSER_PARSE_CATEGORIES_SUCCESS, onCategoriesParsed);
  emitter.on(PARSER_PARSE_IMAGE_SUCCESS, onImageParsed);
  emitter.on(PARSER_PARSED_ALL_IMAGES, onParsedAllImages);

  return {
    getEmojis,
    getThemes,
    getCategories,
    getData,
  };
};
