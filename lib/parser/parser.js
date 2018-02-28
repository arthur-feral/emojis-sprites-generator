import os from 'os';
import fs from 'fs-extra';
import {
  kebabCase,
  has,
  debounce,
} from 'lodash';
import logger from '../logger';
import {
  BASE_URL,

  FETCHER_FETCH_CATEGORIES_SUCCESS,
  FETCHER_FETCH_CATEGORY_SUCCESS,
  FETCHER_FETCH_IMAGE_SUCCESS,

  PARSER_PARSE_CATEGORIES_ERROR,
  PARSER_PARSE_CATEGORIES_SUCCESS,
  PARSER_PARSE_CATEGORY_ERROR,
  PARSER_PARSE_CATEGORY_SUCCESS,
  PARSER_PARSE_EMOJI_ERROR,
  PARSER_PARSE_EMOJI_SUCCESS,
  PARSER_SAVE_IMAGE_SUCCESS,
  PARSER_SAVE_IMAGE_ERROR,

  HTML_CATEGORIES_SELECTOR,
  HTML_EMOJIS_SELECTOR,
  HTML_EMOJI_SHORTNAMES,
  HTML_EMOJI_MODIFIERS,
  HTML_EMOJI_THEMES, FETCHER_FETCH_EMOJI_SUCCESS,
  PARSER_FOUND_MODIFIERS,
} from '../constants';
import cheerio from 'cheerio';
import { omit } from 'lodash';
import {
  getUnicode,
} from '../utils';

// const tempPath = os.tmpdir();
const tempPath = `${process.cwd()}/tmp`;

/**
 *
 * @param config
 * @param emitter
 * @return {{parseCategories: function(), parseCategory: function(*), parseEmoji: function(*), parseImage: function(*=)}}
 */
export default (config, emitter) => {
  let emojisData = {};

  const parseCategories = ({ text }) => {
    logger.sameLine('[Parser] Parsing index...');

    try {
      const $ = cheerio.load(text);
      const $categoriesContainer = $(HTML_CATEGORIES_SELECTOR);
      if ($categoriesContainer.find('h2').text() !== 'Categories') {
        throw new Error('[Scrapper] Canno\'t get categories list, Html structure has changed');
      }

      let categories = [];
      $categoriesContainer.find('a').each(function () {
        const $emojiNode = $(this).find('.emoji');
        const symbol = $emojiNode.text();

        $emojiNode.remove();
        const url = `${BASE_URL}${$(this).attr('href')}`;
        const fullName = $(this).text().trim();
        const name = $(this).attr('href').replace(/\//g, '');
        const category = {
          symbol,
          url,
          name,
          fullName,
        };

        categories.push(category);
      });
      logger.sameLine('[Parser] Parsing done...');
      emitter.emit(PARSER_PARSE_CATEGORIES_SUCCESS, categories);
    } catch (error) {
      logger.error(error.message);
      emitter.emit(PARSER_PARSE_CATEGORIES_ERROR, error);
    }
  };

  const parseCategory = (category, { text }) => {
    try {
      const $ = cheerio.load(text);
      const $emojisList = $(HTML_EMOJIS_SELECTOR);
      if ($emojisList.length === 0) {
        throw new Error('[Scrapper] Cannot get emojis list, Html structure has changed');
      }

      let emojis = [];

      $emojisList.find('a').each(function () {
        const $emojiNode = $(this).find('.emoji');
        const symbol = $emojiNode.text();

        $emojiNode.remove();
        const url = `${BASE_URL}${$(this).attr('href')}`;
        const fullName = $(this).text().trim();
        const name = $(this).attr('href').replace(/\//g, '');
        const emoji = {
          symbol,
          url,
          name,
          fullName,
          category: category.name,
        };

        emojis.push(emoji);
      });

      emitter.emit(PARSER_PARSE_CATEGORY_SUCCESS, category, emojis);
    } catch (error) {
      logger.error(error.message);
      emitter.emit(PARSER_PARSE_CATEGORY_ERROR, error);
    }
  };

  const parseEmoji = (category, emojiBase, { text }) => {
    try {
      let emojiFull = {
        ...omit(emojiBase, 'url'),
        unicode: getUnicode(emojiBase.symbol),
        shortnames: [],
        modifiers: [],
        themes: {},
      };
      const $ = cheerio.load(text);
      const $shortNames = $(HTML_EMOJI_SHORTNAMES);
      const $themes = $(HTML_EMOJI_THEMES);
      const $modifiers = $(HTML_EMOJI_MODIFIERS);

      $themes.each(function () {
        const themeName = $(this)
          .find('.vendor-info')
          .find('a').attr('href').replace(/\//g, '');
        const imagePath = $(this)
          .find('.vendor-image')
          .find('img').attr('src');

        emojiFull.themes[themeName] = imagePath;
      });

      $shortNames.each(function () {
        const textContent = $(this).text();
        emojiFull.shortnames.push(kebabCase(textContent.replace(/:/gi, '')));
      });

      if (!emojiFull.shortnames.length) {
        emojiFull.shortnames.push(emojiFull.name);
        emojiFull.shortname = emojiFull.name;
      } else {
        emojiFull.shortname = emojiFull.shortnames[0];
      }

      // if this emoji is not a modifier
      if (!has(emojiBase, 'parent')) {
        if ($modifiers.length) {
          $modifiers.each(function () {
            const $modifierLink = $(this).find('a');
            const modifierSymbol = $modifierLink.find('.emoji').text();
            const url = $modifierLink.attr('href');
            $modifierLink.find('.emoji').remove();
            const modifierFullName = $modifierLink.text().trim();

            emojiFull.modifiers.push({
              parent: emojiFull.name,
              fullName: modifierFullName,
              name: url.replace(/\//g, ''),
              symbol: modifierSymbol,
              category: emojiFull.category,
              url: `${BASE_URL}${url}`,
            });
          });
          emitter.emit(PARSER_FOUND_MODIFIERS, category, emojiFull.modifiers);
        }
      }

      emitter.emit(PARSER_PARSE_EMOJI_SUCCESS, category, emojiFull);
    } catch (error) {
      logger.error(error.message);
      emitter.emit(PARSER_PARSE_EMOJI_ERROR, error);
    }
  };

  const parseImage = (category, emoji, themeName, result) => {
    try {
      let imageFolder = `${tempPath}/images/${themeName}/${category.name}`;
      let imagePath = `${imageFolder}/${emoji.shortname}_raw.png`;
      fs.mkdirpSync(imageFolder);
      fs.writeFile(imagePath, result.body, function (error) {
        if (error) {
          emitter.emit(PARSER_SAVE_IMAGE_ERROR, error);
        }
        emitter.emit(PARSER_SAVE_IMAGE_SUCCESS, category, emoji, themeName, imagePath);
      });
      emitter.emit(PARSER_SAVE_IMAGE_SUCCESS, category, emoji, themeName, imagePath);

    } catch (error) {
      logger.error(error.message);
      emitter.emit(PARSER_SAVE_IMAGE_ERROR, error);
    }
  };

  const parseImageThrottle = debounce(parseImage, 50);

  emitter.on(FETCHER_FETCH_CATEGORIES_SUCCESS, parseCategories);
  emitter.on(FETCHER_FETCH_CATEGORY_SUCCESS, parseCategory);
  emitter.on(FETCHER_FETCH_EMOJI_SUCCESS, parseEmoji);
  emitter.on(FETCHER_FETCH_IMAGE_SUCCESS, parseImage);

  return {
    parseCategories,
    parseCategory,
    parseEmoji,
    parseImage,
  };
}