import fs from 'fs';
import os from 'os';
import logger from '../logger';
import {
  BASE_URL,

  FETCHER_FETCH_CATEGORIES_ERROR,
  FETCHER_FETCH_CATEGORIES_SUCCESS,
  FETCHER_FETCH_CATEGORY_ERROR,
  FETCHER_FETCH_CATEGORY_SUCCESS,
  FETCHER_FETCH_IMAGE_ERROR,
  FETCHER_FETCH_IMAGE_SUCCESS,

  PARSER_PARSE_CATEGORIES_ERROR,
  PARSER_PARSE_CATEGORIES_SUCCESS,
  PARSER_PARSE_CATEGORY_ERROR,
  PARSER_PARSE_CATEGORY_SUCCESS,
  PARSER_PARSE_EMOJI_ERROR,
  PARSER_PARSE_EMOJI_SUCCESS,
  PARSER_PARSE_IMAGE_ERROR,
  PARSER_PARSE_IMAGE_SUCCESS,

  HTML_CATEGORIES_SELECTOR,
  HTML_EMOJIS_SELECTOR,
  HTML_EMOJI_SHORTNAMES,
} from '../constants';
import cheerio from 'cheerio';
import { omit } from 'lodash';

const tempPath = os.tmpdir();

const categoriesFetched = 0;

/**
 * format char unicode to something like this
 * "D83D-DC69-200D-2764-FE0F-200D-D83D-DC69"
 * @param char
 * @returns {string}
 */
const getUnicode = (char) => {
  var i = 0, c = 0, p = 0, r = [];
  while (i < char.length) {
    c = char.charCodeAt(i++);
    if (p) {
      r.push((65536 + (p - 55296 << 10) + (c - 56320)).toString(16));
      p = 0;
    } else if (55296 <= c && c <= 56319) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join('-');
};

/**
 *
 * @param config
 * @param emitter
 * @return {{parseCategories: function(), parseCategory: function(*), parseEmoji: function(*), parseImage: function(*=)}}
 */
export default (config, emitter) => {
  let emojisData = {};

  const parseCategories = (categoriesRaw) => {
    try {
      const $ = cheerio.load(categoriesRaw);
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
        const fullName = $(this).text().replace(/^ /g, '');
        const name = $(this).attr('href').replace(/\//g, '');
        const category = {
          symbol,
          url,
          name,
          fullName,
        };

        categories.push(category);
      });

      emitter.emit(PARSER_PARSE_CATEGORIES_SUCCESS, categories);
    } catch (error) {
      emitter.emit(PARSER_PARSE_CATEGORIES_ERROR, error);
    }
  };

  const parseCategory = (category, categoryRaw) => {
    try {
      const $ = cheerio.load(categoryRaw);
      const $emojisList = $(HTML_EMOJIS_SELECTOR);
      if ($emojisList.length === 0) {
        throw new Error('[Scrapper] Canno\'t get emojis list, Html structure has changed');
      }

      let emojis = [];

      $emojisList.find('a').each(function () {
        const $emojiNode = $(this).find('.emoji');
        const symbol = $emojiNode.text();

        $emojiNode.remove();
        const url = `${BASE_URL}${$(this).attr('href')}`;
        const fullName = $(this).text().replace(/^ /g, '');
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

      emitter.emit(PARSER_PARSE_CATEGORY_SUCCESS, category.name, emojis);
    } catch (error) {
      emitter.emit(PARSER_PARSE_CATEGORY_ERROR, error);
    }
  };

  const parseEmoji = (emojiBase, emojiRaw) => {
    try {
      let emojiFull = {
        ...omit(emojiBase, 'url'),
        shortnames: [],
      };
      const $ = cheerio.load(emojiRaw);
      const $shortNames = $(HTML_EMOJI_SHORTNAMES);
      $shortNames.each(function () {
        const textContent = $(this).text();
        emojiFull.shortnames.push(textContent.replace(/:/gi, ''));
      });

      if (!emojiFull.shortnames.length) {
        emojiFull.shortnames.push(emojiFull.name);
        emojiFull.shortname = emojiFull.name;
      } else {
        emojiFull.shortname = emojiFull.shortnames[0];
      }

      emojiFull.unicode = getUnicode(emojiFull.symbol);

      emitter.emit(PARSER_PARSE_EMOJI_SUCCESS, emojiFull.name, emojiFull);
    } catch (error) {
      emitter.emit(PARSER_PARSE_EMOJI_ERROR, error);
    }
  };

  const parseImage = (categoriesRaw) => {
    try {

    } catch (error) {
      emitter.emit(PARSER_PARSE_IMAGE_ERROR, error);
    }
  };

  return {
    parseCategories,
    parseCategory,
    parseEmoji,
    parseImage,
  };
}