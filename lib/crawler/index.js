'use strict';

const cheerio = require('cheerio');
const _ = require('lodash');
let emojisCrawled = 0;
let extraEmojisCrawled = 0;
let categoriesCrawled = 0;

module.exports = (logger) => {

  /**
   *
   * @param emojiRaw
   * @param html
   * @param isModifier
   * @returns {*}
   */
  const getEmojiDatasFromHtml = (emojiRaw, html, isModifier) => {
    let emoji = _.merge({}, emojiRaw);
    // Get modifiers
    let $ = cheerio.load(html);
    let $article = $('article');

    // Get emoji name from title
    let $title = $article.find('h1').first();
    $title.find('.emoji').remove();
    emoji.fullName = $title.text().replace(/^ /, '');
    $title.remove();

    // remove description
    $article.find('section.description').remove();

    // remove aliases
    $article.find('section.aliases').remove();

    // get images
    let $availableThemes = $article.find('.vendor-list').find('.vendor-rollout-target');
    $availableThemes.each(function() {
      const themeName = $(this).find('.vendor-info').first().find('a').attr('href').replace(/\//g, '');
      const imagePath = $(this).find('.vendor-image').first().find('img').attr('src');

      emoji.themes[themeName] = imagePath;
    });

    $article.find('section.vendor-list').remove();

    // remove ads
    $article.find('.ad-below-images').remove();

    if (!isModifier) {
      const $modifiersList = $article.find('section.modifiers');
      if ($modifiersList.length) {
        emoji['modifiers'] = [];
        let $modifiers = $modifiersList.find('a');
        $modifiers.each(function(i) {
          const char = $(this).find('.emoji').text();
          const url = $(this).attr('href');
          $(this).find('.emoji').remove();
          const text = $(this).text().replace(/^ /, '');

          emoji['modifiers'].push({
            url: url,
            shortname: url.replace(/\//g, ''),
            char: char,
            category: emoji.category,
            fullName: text,
            index: emoji.index
          });
        });
      }
      $article.find('section.modifiers').remove();
    }

    return emoji;
  };

  /**
   *
   * @param html
   * @returns {Array}
   */
  const crawlIndexPage = (html) => {
    let $ = cheerio.load(html);
    const $categoriesBlock = $('div.sidebar div.block').first();
    if ($categoriesBlock.find('h2').text() !== 'Categories') {
      throw new Error('Html structure has changed, need update');
    }

    const categories = [];
    $categoriesBlock.find('a').each(function() {
      $(this).find('.emoji').remove();
      const text = $(this).text().replace(/^ /g, '');
      const url = $(this).attr('href');
      categories.push({
        name: url.replace(/\//g, ''),
        url: url,
        fullName: text
      });
    });

    if (!categories.length) {
      throw new Error('No categories found');
    }

    return categories;
  };

  /**
   *
   * @param category
   * @param html
   */
  const crawlCategoryPages = (category, html) => {
    categoriesCrawled++;
    logger.count(categoriesCrawled + ' categories scrapped');

    const $ = cheerio.load(html);
    const $emojisList = $('.emoji-list');
    const $links = $emojisList.find('a');

    let emojis = [];
    $links.each(function() {
      const char = $(this).find('.emoji').text();
      const url = $(this).attr('href');
      $(this).find('.emoji').remove();
      const text = $(this).text().replace(/^ /g, '');
      emojis.push({
        url: url,
        shortname: url.replace(/\//g, ''),
        char: char,
        category: category.name,
        fullName: text
      });
    });

    return {
      [category.name]: _.merge(category, {
        emojis: emojis
      })
    };
  };

  /**
   *
   * @param emoji
   * @param index
   * @param html
   * @param isModifier
   * @returns {*}
   */
  const crawlEmojiPage = (emoji, index, html, isModifier) => {
    emoji = _.merge({
      themes: {},
    }, emoji);
    if (!isModifier) {
      emoji.index = index;
    }

    emoji = _.merge(emoji, getEmojiDatasFromHtml(emoji, html, isModifier));
    delete emoji.url;

    return emoji;
  };

  /**
   *
   * @param emoji
   * @param index
   * @param html
   * @param isModifier
   * @returns {*}
   */
  const crawlEmojisPages = (emoji, index, html, isModifier) => {
    if (isModifier) {
      extraEmojisCrawled++;
      logger.count(extraEmojisCrawled + ' extra emojis crawled');
    } else {
      emojisCrawled++;
      logger.count(emojisCrawled + ' emojis crawled');
    }

    return crawlEmojiPage(emoji, index, html, isModifier);
  };

  return {
    getEmojiDatasFromHtml,
    crawlIndexPage,
    crawlCategoryPages,
    crawlEmojisPages,
    crawlEmojiPage
  };
};
