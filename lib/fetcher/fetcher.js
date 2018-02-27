import fs from 'fs';
import os from 'os';
import Throttle from 'superagent-throttle';
import logger from '../logger';
import {
  forEach,
  size,
} from 'lodash';
import superagent from 'superagent';
import {
  APP_START,
  BASE_URL,
  FETCHER_FETCH_CATEGORIES_ERROR,
  FETCHER_FETCH_CATEGORIES_SUCCESS,
  FETCHER_FETCH_CATEGORY_ERROR,
  FETCHER_FETCH_CATEGORY_SUCCESS,
  FETCHER_FETCH_EMOJI_ERROR,
  FETCHER_FETCH_EMOJI_SUCCESS,
  FETCHER_FETCH_IMAGE_ERROR,
  FETCHER_FETCH_IMAGE_SUCCESS,
  PARSER_PARSE_CATEGORIES_SUCCESS,
  PARSER_PARSE_CATEGORY_SUCCESS,
  PARSER_FOUND_MODIFIERS, PARSER_PARSE_EMOJI_SUCCESS, PARSER_IMAGES_FOUND,
} from '../constants';

const throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 300,          // how many requests can be sent every `ratePer`
  ratePer: 1000,   // number of ms in which `rate` requests may be sent
  concurrent: 100     // how many requests can be sent concurrently
});

const tempPath = os.tmpdir();

const categoriesFetched = 0;

/**
 *
 * @param emitter
 * @param config
 * @return {{fetchCategories: function()}}
 */
export default (config, emitter) => {
  /**
   *
   * @return {Promise}
   */
  const fetchCategories = () => {
    // logger.sameLine('[Fetcher] Fetching index...');
    logger.sameLine('[Fetcher] Fetching index...');

    return new Promise((resolve, reject) => {
      superagent.get(BASE_URL)
        .end((error, result) => {
          if (error) {
            emitter.emit(FETCHER_FETCH_CATEGORIES_ERROR, error);
            reject(error);
          }

          // logger.sameLine('[Fetcher] Fetched index...');
          logger.sameLine('[Fetcher] Fetching done...');
          emitter.emit(FETCHER_FETCH_CATEGORIES_SUCCESS, result);
          resolve(result);
        });
    });
  };

  const fetchCategory = (category) => {
    return new Promise((resolve, reject) => {
      superagent.get(category.url)
        .end((error, result) => {
          if (error) {
            emitter.emit(FETCHER_FETCH_CATEGORY_ERROR, error);
            reject(error);
          }

          emitter.emit(FETCHER_FETCH_CATEGORY_SUCCESS, category, result);
          resolve(result);
        });
    });
  };

  const fetchEmoji = (category, emoji) => {
    return new Promise((resolve, reject) => {
      superagent.get(emoji.url)
        .use(throttle.plugin())
        .end((error, result) => {
          if (error) {
            emitter.emit(FETCHER_FETCH_EMOJI_ERROR, error);
            reject(error);
          }
          emitter.emit(FETCHER_FETCH_EMOJI_SUCCESS, category, emoji, result);
          resolve(result);
        });
    });
  };

  const fetchImage = (category, emoji, themeName, url) => {
    return new Promise((resolve, reject) => {
      superagent.get(url)
        .use(throttle.plugin())
        .end((error, result) => {
          if (error || !result.body) {
            emitter.emit(FETCHER_FETCH_IMAGE_ERROR, error);
            reject(error);
          }

          emitter.emit(FETCHER_FETCH_IMAGE_SUCCESS, category, emoji, themeName, result);
          resolve(result);
        });
    });
  };

  emitter.on(APP_START, fetchCategories);
  emitter.on(PARSER_PARSE_CATEGORIES_SUCCESS, (categories) => {
    logger.info('[Fetcher] Fetching categories...');
    categories.map(category => fetchCategory(category));
  });

  emitter.on(PARSER_FOUND_MODIFIERS, (category, emojis) => {
    emojis.map(emoji => fetchEmoji(category, emoji));
  });

  emitter.on(PARSER_PARSE_CATEGORY_SUCCESS, (category, emojis) => {
    emojis.map(emoji => fetchEmoji(category, emoji));
  });

  emitter.on(PARSER_PARSE_EMOJI_SUCCESS, (category, emoji) => {
    emitter.emit(PARSER_IMAGES_FOUND, size(emoji.themes));
    forEach(emoji.themes, (url, themeName) => {
      fetchImage(category, emoji, themeName, url);
    });
  });

  return {
    fetchCategories,
    fetchCategory,
    fetchEmoji,
    fetchImage,
  };
}