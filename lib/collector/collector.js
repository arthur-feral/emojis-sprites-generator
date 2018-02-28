import {
  reduce,
  has,
  forEach,
  keys,
} from 'lodash';
import {
  PARSER_PARSE_CATEGORIES_SUCCESS,
  PARSER_PARSE_EMOJI_SUCCESS,
  PARSER_PARSE_IMAGE_SUCCESS,
  COLLECTOR_COLLECT_DONE, PARSER_IMAGES_FOUND, PARSER_PARSED_ALL_IMAGES,
} from '../constants';
import logger from '../logger';

export default (config, emitter) => {
  let imagesTotal = 0;
  let imagesComputed = 0;
  let data = {};
  let themes = {};

  emitter.on(PARSER_IMAGES_FOUND, (themesFound) => {
    forEach(themesFound, (url, themeName) => {
      if (!has(themes, themeName)) {
        themes[themeName] = themeName;
      }
    });
  });


  emitter.on(PARSER_PARSE_EMOJI_SUCCESS, (category, emojiFull) => {
    data = {
      ...data,
      [category.name]: {
        ...data[category.name],
        emojis: {
          ...data[category.name].emojis,
          [emojiFull.shortname]: emojiFull,
        },
      },
    };
  });

  emitter.on(PARSER_PARSED_ALL_IMAGES, () => {
    /*
      // some emojis with same shortname are dispatched in some categories
      // it brings css classnames collisions and falsy positions...
      let shortnames = [];
      let datasClean = _.cloneDeep(datas);
      _.each(datasClean, (category => {
        datasClean[category.name].emojis = _.chain(category.emojis)
          .filter((emoji) => {
            if (_.indexOf(shortnames, emoji.shortname) === -1) {
              shortnames.push(emoji.shortname);
              return true;
            } else {
              return false;
            }
          })
          .orderBy('index')
          .value();
      }));
    */
    emitter.emit(COLLECTOR_COLLECT_DONE, data, keys(themes));
  });

  emitter.on(PARSER_PARSE_CATEGORIES_SUCCESS, (categories) => {
    data = reduce(categories, (result, category) => {
      return {
        ...result,
        [category.name]: category,
      };
    }, data);
  });

  return {};
};
