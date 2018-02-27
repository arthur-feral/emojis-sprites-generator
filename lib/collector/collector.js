import {
  PARSER_FOUND_MODIFIERS,
  PARSER_PARSE_CATEGORIES_SUCCESS,
  PARSER_PARSE_CATEGORY_SUCCESS,
  PARSER_PARSE_EMOJI_SUCCESS,
  PARSER_PARSE_IMAGE_SUCCESS,
  PARSER_IMAGES_FOUND,
} from '../constants';
import logger from '../logger';

export default (config, emitter) => {
  let emojisTotal = 0;
  let imagesTotal = 0;
  let imagesComputed = 0;
  let categoriesTotal = 0;
  let categoriesScrapped = 0;
  let emojisScrapped = 0;

  const displayProgession = () => {
    logger.sameLine(`[Collector] # Categories: ${categoriesScrapped}/${categoriesTotal} (${Math.ceil(categoriesScrapped / categoriesTotal * 100)}%) # Emojis: ${emojisScrapped}/${emojisTotal} (${Math.ceil(emojisScrapped / emojisTotal * 100)}%) # Images: ${imagesComputed}/${imagesTotal} (${Math.ceil(imagesComputed / imagesTotal * 100)}%)`);
  };

  emitter.on(PARSER_PARSE_CATEGORIES_SUCCESS, (categories) => {
    categoriesTotal += categories.length;
    displayProgession();
  });
  emitter.on(PARSER_FOUND_MODIFIERS, (category, emojis) => {
    emojisTotal += emojis.length;
    displayProgession();
  });

  emitter.on(PARSER_PARSE_CATEGORY_SUCCESS, (category, emojis) => {
    emojisTotal += emojis.length;
    categoriesScrapped += 1;
  });

  emitter.on(PARSER_PARSE_EMOJI_SUCCESS, (category, emoji) => {
    emojisScrapped += 1;
  });

  emitter.on(PARSER_IMAGES_FOUND, (count) => {
    imagesTotal += count;
    displayProgession();
  });

  emitter.on(PARSER_PARSE_IMAGE_SUCCESS, (category, emoji, themeName, imagePath) => {
    displayProgession();
  });
};

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