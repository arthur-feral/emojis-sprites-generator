import fs from 'fs-extra';
import {
  reduce,
  omit,
  map,
  has,
  forEach,
  get,
  keys,
  size,
} from 'lodash';
import {
  PARSER_PARSE_CATEGORIES_SUCCESS,
  PARSER_PARSE_EMOJI_SUCCESS,
  PARSER_PARSE_IMAGE_SUCCESS,
  COLLECTOR_COLLECT_DONE,
  PARSER_PARSED_ALL_IMAGES,
  PARSER_PARSE_CATEGORY_SUCCESS,
  PARSER_FOUND_MODIFIERS,
  GENERATOR_GENERATE_THEMES_SUCCESS, GENERATOR_GENERATE_SPRITE_SUCCESS, GENERATOR_GENERATE_STYLE_SUCCESS,
  FETCHER_FETCH_IMAGE_ERROR, PARSER_FOUND_THEME,
} from '../constants';
import logger from '../logger';

/**
 * This module collect all data gathered by the fetcher and the parser
 * @param {object} config
 * @param {object} emitter
 * @return {{getEmojis: function(): {}, getThemes: function(): {}, getCategories: function(): {}, getData: function(): {}}}
 */
export default (config, emitter) => {
  let emojisTotal = 0;
  let emojisScrapped = 0;
  let imagesTotal = 0;
  let imagesComputed = 0;
  let imagesFailedCount = 0;

  let data = {};

  // it contains all emojis and their data
  let emojis = {};

  // it contains all categories and their data
  let categories = {};

  // it contains all the emojis for a specific theme
  let emojisThemes = {};

  const getEmojis = () => emojis;
  const getCategories = () => categories;
  const getData = () => data;

  /**
   * @description event handler
   * it catches all themes receptions when we parse an emoji page
   * @param {object} emoji the emoji data
   * @param {string} themeName the theme name
   * @param {string} imageUrl image url
   */
  const onThemeFound = (emoji, themeName, imageUrl) => {
    imagesTotal += 1;
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
      [parsedEmoji.name]: parsedEmoji,
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
  };

  const onImageParsed = (emoji, themeName, imagePath) => {
    imagesComputed += 1;

    emojisThemes = {
      ...emojisThemes,
      [themeName]: {
        ...emojisThemes[themeName] || {},
        [imagePath]: emoji.name,
      },
    };

    if (emojisTotal === emojisScrapped && imagesTotal === (imagesComputed - imagesFailedCount)) {
      logger.success('📡 Collecting data: ✅');
      emitter.emit(PARSER_PARSED_ALL_IMAGES);
    }
  };

  /**
   * if the image cannot be fetched so we remove the emoji from the theme
   * otherwise, the sprite generation will fail
   * @param error
   * @param emoji
   * @param themeName
   */
  const onImageFail = (error, emoji, themeName) => {
    imagesFailedCount += 1;
    emojisThemes = {
      ...emojisThemes,
      [themeName]: emojisThemes[themeName].filter(emojiName => emojiName !== emoji.name),
    };

    emojisThemes = {
      ...emojisThemes,
      [themeName]: {
        ...omit(emojisThemes[themeName] || {}, imagePath),
      },
    };
  };

  /**
   * HERE WE COLLECTED ALL DATA AND IMAGES WE NEED
   * we can clean the data and start building themes
   */
  const onParsedAllImages = () => {
    /*
    what we do here:
    we select only main emojis and remove modifiers from the emojis list, coz they are in the main emojis modifiers key
     */
    let themes = reduce(emojisThemes, (result, emojisTheme, themeName) => ({
      ...result,
      [themeName]: reduce(emojisTheme, (result, emojiName, imageUrl) => ({
        ...result,
        [emojiName]: imageUrl,
      }), {}),
    }), {});

    emitter.emit(COLLECTOR_COLLECT_DONE, themes);
  };

  const generateJSONS = (theme) => {
    let dataClean = {};
    forEach(categories, (category) => {
      dataClean = {
        ...dataClean,
        [category.name]: omit(category, 'url'),
      };
    });

    emojis = reduce(emojis, (result, emoji) => ({
      ...result,
      [emoji.name]: {
        ...omit(emoji, 'themes'),
        modifiers: reduce(emoji.modifiers, (result, modifier) => ({
          ...emoji.modifiers,
          [modifier.name]: omit(modifier, 'themes'),
        }), {}),
      },
    }), {});

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
  };

  const generateThemeJSON = (theme) => {
    let themeData = {};
    const themeEmojis = emojisThemes[theme];

    themeEmojis.map((emoji) => {
      if (!has(emoji, 'parent')) {
        themeData = {
          ...themeData,
          [emoji.category]: {
            ...themeData[emoji.category] || categories[emoji.category],
            emojis: [
              ...get(themeData, `[${emoji.category}].emojis`, []),
              emoji,
            ],
          },
        };
      }
    });

    fs.writeFileSync(`${config.destination}/${theme}/${theme}.json`, JSON.stringify(themeData), 'utf8');
  };

  //emitter.on(GENERATOR_GENERATE_STYLE_SUCCESS, generateThemeJSON);
  emitter.on(GENERATOR_GENERATE_THEMES_SUCCESS, generateJSONS);
  emitter.on(PARSER_FOUND_THEME, onThemeFound);
  emitter.on(PARSER_PARSE_EMOJI_SUCCESS, onEmojiParsed);
  emitter.on(PARSER_PARSE_CATEGORIES_SUCCESS, onCategoriesParsed);
  emitter.on(PARSER_PARSE_IMAGE_SUCCESS, onImageParsed);
  emitter.on(PARSER_PARSED_ALL_IMAGES, onParsedAllImages);
  emitter.on(FETCHER_FETCH_IMAGE_ERROR, onImageFail);

  emitter.on(PARSER_FOUND_MODIFIERS, (emojis) => {
    emojisTotal += size(emojis);
  });

  emitter.on(PARSER_PARSE_CATEGORY_SUCCESS, (emojis) => {
    emojisTotal += emojis.length;
  });

  return {
    getEmojis,
    getCategories,
    getData,
  };
};
