import fs from 'fs-extra';
import os from 'os';
import {
  map,
  each,
  omit,
} from 'lodash';
import superagent from 'superagent';
import Throttle from 'superagent-throttle';
import when from 'when';
import { Config } from '../config';
import cheerio from 'cheerio';
import logger from '../logger';
import {

  // @todo delete this
  takeFromObject,
  reduceDatas,
} from '../utils';

// Set up to 100 req / s
const throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 300,          // how many requests can be sent every `ratePer`
  ratePer: 1000,   // number of ms in which `rate` requests may be sent
  concurrent: 100     // how many requests can be sent concurrently
});

const BASE_URL = 'https://emojipedia.org';
const tempPath = os.tmpdir();
const HTML_CATEGORIES_SELECTOR = 'body div.container div.sidebar div.block:first-child';
const HTML_EMOJIS_SELECTOR = 'body div.container div.content ul.emoji-list';
const HTML_EMOJI_TITLE = 'body div.container div.content article h1';
const HTML_EMOJI_SYMBOL = 'body div.container div.content article section.description input#emoji-copy';
const HTML_EMOJI_FULLNAME = 'body div.container div.content article section.unicodename';

let emojisScrapped = 1;
let totalEmojis = 0;

/**
 * @name extractCategories
 * @description extract categories metadata from html page
 * @param {String} html
 * @return {Object}
 */
export const extractCategories = (html) => {
  logger.info('[Scrapper] Extracting categories metadata...');

  let emojisData = {};

  const $ = cheerio.load(html);
  const $categoriesContainer = $(HTML_CATEGORIES_SELECTOR);
  if ($categoriesContainer.find('h2').text() !== 'Categories') {
    throw new Error('[Scrapper] Canno\'t get categories list, Html structure has changed');
  }

  $categoriesContainer.find('a').each(function() {
    const $emojiNode = $(this).find('.emoji');
    const symbol = $emojiNode.text();

    $emojiNode.remove();
    const url = `${BASE_URL}${$(this).attr('href')}`;
    const fullName = $(this).text().replace(/^ /g, '');
    const name = $(this).attr('href').replace(/\//g, '');
    emojisData = {
      ...emojisData,
      [name]: {
        symbol,
        url,
        name,
        fullName,
      },
    };
  });

  return emojisData;
};

/**
 * @name getCategories
 * @description fetch website main page to get categories list
 * @return {when.Promise}
 */
export const getCategories = () => {
  logger.info('[Scrapper] Getting categories metadata...');

  return when.promise((resolve, reject) => {
    superagent.get(BASE_URL)
      .end((error, result) => {
        if (error) {
          reject(error);
        }

        try {
          resolve(extractCategories(result.text));
        } catch (extractError) {
          reject(extractError);
        }
      });
  });
};

export const extractEmojis = (category, html) => {
  let data = {};

  const $ = cheerio.load(html);
  const $emojisList = $(HTML_EMOJIS_SELECTOR);
  if ($emojisList.length === 0) {
    throw new Error('[Scrapper] Canno\'t get emojis list, Html structure has changed');
  }

  logger.sameLine(`[Scrapper] Extracting emojis ${category.name}...`);
  $emojisList.find('a').each(function() {
    const $emojiNode = $(this).find('.emoji');
    const symbol = $emojiNode.text();

    $emojiNode.remove();
    const url = `${BASE_URL}${$(this).attr('href')}`;
    const fullName = $(this).text().replace(/^ /g, '');
    const name = $(this).attr('href').replace(/\//g, '');
    data = {
      ...data,
      [name]: {
        symbol,
        url,
        name,
        fullName,
      },
    };
  });

  return {
    [category.name]: {
      ...category,
      emojis: data,
    },
  };
};

export const getEmojisFromCategory = (category) => {
  logger.info(`[Scrapper] Fetching ${category.url}...`);
  return when.promise((resolve, reject) => {
    superagent.get(category.url)
      .use(throttle.plugin())
      .end((error, result) => {
        if (error) {
          reject(error);
        }

        try {
          resolve(extractEmojis(category, result.text));
        } catch (extractError) {
          reject(extractError);
        }
      });
  });
};

export const getEmojisFromCategories = (emojisData) => {
  let metaData = {
    ...emojisData,
  };
  logger.info('[Scrapper] Fetching categories pages...');

  return when
    .all(
      map(emojisData, category => getEmojisFromCategory(category)),
    )
    .spread(function() {
      logger.success('\n[Scrapper] Categories fetched');
      return reduceDatas(arguments);
    })
    .catch((err) => {
      console.log(err);
    });
};

export const extractEmoji = (data, html) => {
  let emoji = {
    ...data,
  };
  const $ = cheerio.load(html);

  let $title = $(HTML_EMOJI_TITLE);
  $title.find('.emoji').remove();
  let title = $title.text().replace(/^ /g, '');

  const symbol = $(HTML_EMOJI_SYMBOL).val();

  let $fullName = $(HTML_EMOJI_FULLNAME);
  $fullName.find('..emoji').remove();
  let fullName = $fullName.text().replace(/^ /g, '');

  const nameUrl = $(this).attr('href').replace(/\//g, '');

  logger.sameLine(`[Scrapper] Fetched ${emojisScrapped}/${totalEmojis} (${Math.ceil(emojisScrapped / totalEmojis * 100)}%)...`);
  emojisScrapped += 1;
  return {
    [emoji.name]: {
      ...omit(emoji, 'url'),
    },
  };
};

export const getEmoji = (emoji) => {
  totalEmojis += 1;
  return when.promise((resolve, reject) => {
    superagent.get(emoji.url)
      .use(throttle.plugin())
      .end((error, result) => {
        if (error) {
          reject(error);
        }

        try {
          resolve(extractEmoji(emoji, result.text));
        } catch (extractError) {
          reject(extractError);
        }
      });
  });
};

export const getCategoryEmojis = (category) => {
  const emojis = takeFromObject(category.emojis, 10);

  return when
    .all(
      map(emojis, emoji => getEmoji(emoji)),
    )
    .spread(function() {
      logger.success(`\n[Scrapper] category ${category.name} successfully explored`);
      return {
        [category.name]: {
          ...omit(category, 'url'),
          emojis: reduceDatas(arguments),
        },
      };
    })
    .catch((err) => {
      console.log(err);
    });
};

export const getEmojis = (emojisData) => {
  let metaData = {
    ...emojisData,
  };

  logger.info('[Scrapper] Fetching emojis pages...');

  return when
    .all(
      map(emojisData, category => getCategoryEmojis(category)),
    )
    .spread(function() {
      logger.success('\n[Scrapper] Emojis fetched');
      return {
        ...metaData,
        ...reduceDatas(arguments)
      };
    })
    .catch((err) => {
      console.log(err);
    });
};

export const save = (config, json) => {
  // some emojis with same shortname are dispatched in some categories
  // it brings css classnames collisions and falsy positions...
  let shortnames = [];
  let datasClean = {
    ...json,
  };
  //
  // each(datasClean, (category => {
  //   datasClean[category.name].emojis = _.chain(category.emojis)
  //     .filter((emoji) => {
  //       if (_.indexOf(shortnames, emoji.shortname) === -1) {
  //         shortnames.push(emoji.shortname);
  //         return true;
  //       } else {
  //         return false;
  //       }
  //     })
  //     .orderBy('index')
  //     .value();
  // }));

  fs.mkdirpSync(config.destination);
  fs.writeFileSync(`${config.destination}/emojis.json`, JSON.stringify(datasClean), 'utf8');
  logger.success(`[Scrapper] Successfully saved emojis json file.`);

  return datasClean;
};

/**
 *
 * @param {Config} config
 */
export const run = (config) => {
  return getCategories()
    .then(getEmojisFromCategories)
    .then(getEmojis)
    .then((data) => {
      return save(config, data);
    });
};
