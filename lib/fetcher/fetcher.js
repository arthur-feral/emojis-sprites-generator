import fs from 'fs-extra';
import os from 'os';
import Throttle from 'superagent-throttle';
import logger from '../logger';
import {
  forEach,
} from 'lodash';
import {
  saveFile,
} from '../utils';
import superagent from 'superagent';
import {
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
  PARSER_PARSE_EMOJI_SUCCESS,
  PARSER_IMAGES_FOUND,
  FILES_DONE,
} from '../constants';

const throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 300,          // how many requests can be sent every `ratePer`
  ratePer: 1000,   // number of ms in which `rate` requests may be sent
  concurrent: 100     // how many requests can be sent concurrently
});

// const tempPath = os.tmpdir();
const tempPath = `${process.cwd()}/tmp`;
const imagesPath = `${tempPath}/images`;
const htmlPath = `${tempPath}/html`;

/**
 *
 * @param config
 * @param emitter
 * @return {{fetchCategories: function()}}
 */
export default (config, emitter) => {
  /**
   *
   * @return {Promise}
   */
  const fetchCategories = () => {
    logger.info('📡 Collecting data: ♻️');
    try {
      const fileContent = fs.readFileSync(`${htmlPath}/index.html`, 'utf8');
      return Promise
        .resolve(fileContent)
        .then(() => {
          emitter.emit(FETCHER_FETCH_CATEGORIES_SUCCESS, fileContent);
        });
    } catch (e) {
      return new Promise((resolve, reject) => {
        superagent.get(BASE_URL)
          .end((error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.text);
            }
          });
      }).then((content) => {
        saveFile(content, htmlPath, 'index.html');
        emitter.emit(FETCHER_FETCH_CATEGORIES_SUCCESS, content);
      }).catch((error) => {
        emitter.emit(FETCHER_FETCH_CATEGORIES_ERROR, error);
      });
    }
  };

  const fetchCategory = (category) => {
    try {
      const fileContent = fs.readFileSync(`${htmlPath}/${category.name}.html`, 'utf8');

      return Promise.resolve(fileContent).then(() => {
        emitter.emit(FETCHER_FETCH_CATEGORY_SUCCESS, category, fileContent);
      });
    } catch (e) {
      return new Promise((resolve, reject) => {
        superagent.get(category.url)
          .end((error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.text);
            }
          });
      }).then((content) => {
        saveFile(content, htmlPath, `${category.name}.html`);
        emitter.emit(FETCHER_FETCH_CATEGORY_SUCCESS, category, content);
      }).catch((error) => {
        emitter.emit(FETCHER_FETCH_CATEGORY_ERROR, error);
      });
    }
  };

  const fetchEmoji = (category, emoji) => {
    try {
      const fileContent = fs.readFileSync(`${htmlPath}/${category.name}/${emoji.name}.html`, 'utf8');

      return Promise.resolve(fileContent).then(() => {
        emitter.emit(FETCHER_FETCH_EMOJI_SUCCESS, category, emoji, fileContent);
      });
    } catch (e) {
      return new Promise((resolve, reject) => {
        superagent.get(emoji.url)
          .use(throttle.plugin())
          .end((error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.text);
            }
          });
      }).then((content) => {
        saveFile(content, `${htmlPath}/${category.name}`, `${emoji.name}.html`);
        emitter.emit(FETCHER_FETCH_EMOJI_SUCCESS, category, emoji, content);
      }).catch((error) => {
        emitter.emit(FETCHER_FETCH_EMOJI_ERROR, error);
      });
    }
  };

  const fetchImage = (category, emoji, themeName, url) => {
    try {
      const fileContent = fs.readFileSync(
        `${imagesPath}/${themeName}/${category.name}/${emoji.shortname}_raw.png`,
      );

      return Promise.resolve(fileContent).then(() => {
        emitter.emit(FETCHER_FETCH_IMAGE_SUCCESS, category, emoji, themeName, fileContent);
      });
    } catch (e) {
      return new Promise((resolve, reject) => {
        superagent.get(url)
          .use(throttle.plugin())
          .end((error, result) => {
            if (error || !result.body) {
              reject(error);
            } else {
              resolve(result.body);
            }
          });
      }).then((content) => {
        saveFile(
          content,
          `${imagesPath}/${themeName}/${category.name}`,
          `${emoji.shortname}_raw.png`,
        );

        emitter.emit(FETCHER_FETCH_IMAGE_SUCCESS, category, emoji, themeName, content);
      }).catch((error) => {
        emitter.emit(FETCHER_FETCH_IMAGE_ERROR, error);
      });
    }
  };


  emitter.on(FILES_DONE, fetchCategories);
  emitter.on(PARSER_PARSE_CATEGORIES_SUCCESS, (categories) => {
    categories.map(category => fetchCategory(category));
  });

  emitter.on(PARSER_FOUND_MODIFIERS, (category, emojis) => {
    emojis.map(emoji => fetchEmoji(category, emoji));
  });

  emitter.on(PARSER_PARSE_CATEGORY_SUCCESS, (category, emojis) => {
    emojis.map(emoji => fetchEmoji(category, emoji));
  });

  emitter.on(PARSER_PARSE_EMOJI_SUCCESS, (category, emoji) => {
    emitter.emit(PARSER_IMAGES_FOUND, emoji.themes);
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