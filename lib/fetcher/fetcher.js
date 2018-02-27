import fs from 'fs';
import os from 'os';
import Throttle from 'superagent-throttle';
import logger from '../logger';
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
  PARSER_FOUND_MODIFIERS,
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
    logger.info('[Fetcher] Fetching index...');

    return new Promise((resolve, reject) => {
      superagent.get(BASE_URL)
        .end((error, result) => {
          if (error) {
            emitter.emit(FETCHER_FETCH_CATEGORIES_ERROR, error);
            reject(error);
          }

          // logger.sameLine('[Fetcher] Fetched index...');
          logger.info('[Fetcher] Fetched index...');
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

  const fetchImage = (path) => {
    return new Promise((resolve, reject) => {
      superagent.get(path)
        .use(throttle.plugin())
        .end((error, result) => {
          if (error) {
            emitter.emit(FETCHER_FETCH_IMAGE_ERROR, error);
            reject(error);
          }

          emitter.emit(FETCHER_FETCH_IMAGE_SUCCESS, result);
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

  return {
    fetchCategories,
    fetchCategory,
    fetchEmoji,
    fetchImage,
  };
}