'use strict';

const fs = require('fs');

const crawler = require('../../lib/crawler')();

const emojipediaMainPage = fs.readFileSync([__dirname, '../mocks/html/emojipediaMainPage.html'].join('/'), 'utf8');
const emojipediaCategoryPeople = fs.readFileSync([__dirname, '../mocks/html/emojipediaCategoryPeople.html'].join('/'), 'utf8');
const emojipediaEmojiWithModifier = fs.readFileSync([__dirname, '../mocks/html/emojipediaEmojiWithModifier.html'].join('/'), 'utf8');
const emojipediaEmojiMultiple = fs.readFileSync([__dirname, '../mocks/html/emojipediaEmojiMultiple.html'].join('/'), 'utf8');
const emojipediaEmojiSimple = fs.readFileSync([__dirname, '../mocks/html/emojipediaEmojiSimple.html'].join('/'), 'utf8');

const emojisForCategory = require('../mocks/jsons/emojisForCategory.json');
const emojiSimple = require('../mocks/jsons/emojiSimple.json');

describe('crawler', () => {
  describe('#crawlIndexPage', () => {
    it('returns an array of categories', () => {
      const categories = crawler.crawlIndexPage(emojipediaMainPage);
      expect(categories).to.deep.equal([
        {
          name: 'people',
          url: '/people/',
          fullName: 'Smileys & People'
        }
      ]);
    });
  });

  describe('#crawlCategoryPages', () => {
    it('adds emojis list to a category', () => {
      const categories = crawler.crawlCategoryPages({
        name: 'people',
        url: '/people/',
        fullName: 'Smileys & People'
      }, emojipediaCategoryPeople);

      expect(categories).to.deep.equal(emojisForCategory);
    });
  });

  describe('#crawlEmojiPage', () => {
    it('adds emojis list to a category', () => {
      const categories = crawler.crawlEmojiPage({
        "url": "/grinning-face/",
        "shortname": "grinning-face",
        "char": "😀",
        "category": "people",
        "fullName": "Grinning Face"
      }, 0, emojipediaEmojiSimple, false);

      expect(categories).to.deep.equal(emojiSimple);
    });
  });
});
