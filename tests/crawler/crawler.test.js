'use strict';

const fs = require('fs');

const logger = require('../../lib/logger');
const crawler = require('../../lib/crawler')(logger);

const emojipediaMainPage = fs.readFileSync([__dirname, '../mocks/html/index.html'].join('/'), 'utf8');
const people = fs.readFileSync([__dirname, '../mocks/html/people.html'].join('/'), 'utf8');
const fatherChristmas = fs.readFileSync([__dirname, '../mocks/html/father-christmas.html'].join('/'), 'utf8');
const griningFace = fs.readFileSync([__dirname, '../mocks/html/grinning-face.html'].join('/'), 'utf8');

const emojisForCategory = require('../mocks/jsons/emojisForCategory.json');
const emojiSimple = require('../mocks/jsons/emojiSimple.json');
const emojiWithModifiers = require('../mocks/jsons/emojiWithModifiers.json');

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
      }, people);

      expect(categories).to.deep.equal(emojisForCategory);
    });
  });

  describe('#crawlEmojiPage', () => {
    describe('emoji dont have modifiers', () => {
      it('adds emojis list to a category', () => {
        const categories = crawler.crawlEmojiPage({
          "url": "/grinning-face/",
          "shortname": "grinning-face",
          "char": "😀",
          "category": "people",
          "unicode": "1f600",
          "fullName": "Grinning Face"
        }, 0, griningFace, false);

        expect(categories).to.deep.equal(emojiSimple);
      });
    });

    describe('emoji have modifiers', () => {
      it('adds emojis list to a category with modifiers list', () => {
        const categories = crawler.crawlEmojiPage({
          "url": "father-christmas",
          "shortname": "father-christmas",
          "char": "🎅",
          "category": "people",
          "unicode": "1f385",
          "fullName": "Father Christmas",
        }, 0, fatherChristmas, false);

        expect(categories).to.deep.equal(emojiWithModifiers);
      });
    });
  });
});
