import {
  size,
} from 'lodash';
import fs from 'fs';
import EventEmitter from 'eventemitter3';
import ParserFactory from './parser';

const baseConfig = {
  destination: `${process.cwd()}/emojis`,
  size: 24,
  fromCache: false,
  prefix: 'emojis',
  preproc: 'sass',
};

const emitter = new EventEmitter();
let parser = ParserFactory(baseConfig, emitter);

const parseCategoriesSuccessSpy = sinon.spy();
const parseCategorySuccessSpy = sinon.spy();
const parseEmojiSuccessSpy = sinon.spy();
const parseImageSuccessSpy = sinon.spy();

emitter.on('PARSER_PARSE_CATEGORIES_SUCCESS', parseCategoriesSuccessSpy);
emitter.on('PARSER_PARSE_CATEGORY_SUCCESS', parseCategorySuccessSpy);
emitter.on('PARSER_PARSE_EMOJI_SUCCESS', parseEmojiSuccessSpy);
emitter.on('PARSER_PARSE_IMAGE_SUCCESS', parseImageSuccessSpy);

const indexHTML = fs.readFileSync(`${__dirname}/fixtures/index.html`, 'utf8');
const categoryHTML = fs.readFileSync(`${__dirname}/fixtures/category.html`, 'utf8');
const emojiHTML = fs.readFileSync(`${__dirname}/fixtures/emoji.html`, 'utf8');
//const emojipediaMainPage = fs.readFileSync([__dirname, '../index.html'].join('/'), 'utf8');
//const people = fs.readFileSync([__dirname, '../mocks/html/people.html'].join('/'), 'utf8');
//const fatherChristmas = fs.readFileSync([__dirname, '../mocks/html/father-christmas.html'].join('/'), 'utf8');
//const griningFace = fs.readFileSync([__dirname, '../mocks/html/grinning-face.html'].join('/'), 'utf8');

const themes = ['Apple', 'emojidex', 'EmojiOne', 'Emojipedia', 'Facebook', 'Google', 'HTC', 'Instagram', 'LG', 'Messenger', 'Microsoft', 'Mozilla', 'Samsung', 'Slack', 'Snapchat', 'Sponsored', 'Telegram', 'Twitter', 'Viber', 'WhatsApp', 'Yo Status'];

describe('Parser', () => {

  describe('#parseCategories', () => {
    it('parse categories data from main page', () => {
      expect(parseCategoriesSuccessSpy.callCount).to.equal(0);
      parser.parseCategories(indexHTML);

      expect(parseCategoriesSuccessSpy.callCount).to.equal(1);
      expect(parseCategoriesSuccessSpy.args[0][0]).to.deep.equal([
        {
          'fullName': 'Smileys & People',
          'name': 'people',
          'symbol': '😃',
          'url': 'https://emojipedia.org/people/',
        },
        {
          'fullName': 'Animals & Nature',
          'name': 'nature',
          'symbol': '🐻',
          'url': 'https://emojipedia.org/nature/',
        },
        {
          'fullName': 'Food & Drink',
          'name': 'food-drink',
          'symbol': '🍔',
          'url': 'https://emojipedia.org/food-drink/',
        },
        {
          'fullName': 'Activity',
          'name': 'activity',
          'symbol': '⚽',
          'url': 'https://emojipedia.org/activity/',
        },
        {
          'fullName': 'Travel & Places',
          'name': 'travel-places',
          'symbol': '🌇',
          'url': 'https://emojipedia.org/travel-places/',
        },
        {
          'fullName': 'Objects',
          'name': 'objects',
          'symbol': '💡',
          'url': 'https://emojipedia.org/objects/',
        },
        {
          'fullName': 'Symbols',
          'name': 'symbols',
          'symbol': '🔣',
          'url': 'https://emojipedia.org/symbols/',
        },
        {
          'fullName': 'Flags',
          'name': 'flags',
          'symbol': '🎌',
          'url': 'https://emojipedia.org/flags/',
        },
      ]);
    });
  });

  describe('#parseCategory', () => {
    it('should parse properly a category and list emojis', () => {
      expect(parseCategorySuccessSpy.callCount).to.equal(0);
      parser.parseCategory({
        'fullName': 'Smileys & People',
        'name': 'people',
        'symbol': '😃',
        'url': 'https://emojipedia.org/people/',
      }, categoryHTML);

      expect(parseCategorySuccessSpy.callCount).to.equal(1);
      expect(parseCategorySuccessSpy.args[0][0]).to.equal('people');
      expect(size(parseCategorySuccessSpy.args[0][1])).to.equal(342);
      expect(parseCategorySuccessSpy.args[0][1][0]).to.deep.equal({
        'fullName': 'Grinning Face',
        'name': 'grinning-face',
        'symbol': '😀',
        'category': 'people',
        'url': 'https://emojipedia.org/grinning-face/',
      });
    });
  });

  describe('#parseEmoji', () => {
    it('should parse properly an emoji page', () => {
      expect(parseEmojiSuccessSpy.callCount).to.equal(0);
      parser.parseEmoji({
        'fullName': 'Grinning Face',
        'name': 'grinning-face',
        'symbol': '😀',
        'category': 'people',
        'url': 'https://emojipedia.org/grinning-face/',
      }, emojiHTML);

      expect(parseEmojiSuccessSpy.callCount).to.equal(1);
      expect(parseEmojiSuccessSpy.args[0][0]).to.equal('grinning-face');
      expect(parseEmojiSuccessSpy.args[0][1]).to.deep.equal({
        'fullName': 'Grinning Face',
        'name': 'grinning-face',
        'symbol': '😀',
        'shortnames': [
          'grinning',
        ],
        'shortname': 'grinning',
        'category': 'people',
        'unicode': '1f600',
      });
    });
  });
});