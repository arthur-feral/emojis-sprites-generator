import fs from 'fs';
import os from 'os';
import Throttle from 'superagent-throttle';
import logger from '../logger';
import superagent from 'superagent';
import {
  BASE_URL,
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
    logger.info('[Scrapper] Getting categories metadata...');

    return new Promise((resolve, reject) => {
      superagent.get(BASE_URL)
        .end((error, result) => {
          if (error) {
            emitter.emit('FETCHER_FETCH_CATEGORIES_ERROR', error);
            reject(error);
          }

          emitter.emit('FETCHER_FETCH_CATEGORIES_SUCCESS', result);
          resolve(result);
        });
    });
  };

  const fetchCategory = (path) => {
    return new Promise((resolve, reject) => {
      superagent.get(`${BASE_URL}${path}`)
        .end((error, result) => {
          if (error) {
            emitter.emit('FETCHER_FETCH_CATEGORY_ERROR', error);
            reject(error);
          }

          emitter.emit('FETCHER_FETCH_CATEGORY_SUCCESS', result);
          resolve(result);
        });
    });
  };

  const fetchEmoji = (path) => {
    return new Promise((resolve, reject) => {
      superagent.get(`${BASE_URL}${path}`)
        .use(throttle.plugin())
        .end((error, result) => {
          if (error) {
            emitter.emit('FETCHER_FETCH_EMOJI_ERROR', error);
            reject(error);
          }

          emitter.emit('FETCHER_FETCH_EMOJI_SUCCESS', result);
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
            emitter.emit('FETCHER_FETCH_IMAGE_ERROR', error);
            reject(error);
          }

          emitter.emit('FETCHER_FETCH_IMAGE_SUCCESS', result);
          resolve(result);
        });
    });
  };

  return {
    fetchCategories,
    fetchCategory,
    fetchEmoji,
    fetchImage,
  };
}