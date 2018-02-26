import fs from 'fs';
import os from 'os';
import logger from '../logger';
import {
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
 * @param config
 * @param emitter
 * @return {{parseCategories: function(), parseCategory: function(*), parseEmoji: function(*), parseImage: function(*=)}}
 */
export default (config, emitter) => {
  /**
   *
   * @return {Promise}
   */
  const parseCategories = (categoriesRaw) => {
    return new Promise((resolve, reject) => {
      try {

      } catch (error) {
        emitter.emit(PARSER_PARSE_CATEGORIES_ERROR, error);
      }
    });
  };

  const parseCategory = (path) => {
    return new Promise((resolve, reject) => {
      try {

      } catch (error) {
        emitter.emit(PARSER_PARSE_CATEGORY_ERROR, error);
      }
    });
  };

  const parseEmoji = (path) => {
    return new Promise((resolve, reject) => {
      try {

      } catch (error) {
        emitter.emit(PARSER_PARSE_EMOJI_ERROR, error);
      }
    });
  };

  const parseImage = (path) => {
    return new Promise((resolve, reject) => {
      try {

      } catch (error) {
        emitter.emit(PARSER_PARSE_IMAGE_ERROR, error);
      }
    });
  };

  return {
    parseCategories,
    parseCategory,
    parseEmoji,
    parseImage,
  };
}