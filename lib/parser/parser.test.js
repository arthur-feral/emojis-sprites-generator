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

// grinning-face
// with shortname
const emojiHTML = fs.readFileSync(`${__dirname}/fixtures/emoji.html`, 'utf8');

// Grinning Face With Star Eyes Emoji
const emojiWithoutShortnamesHTML = fs.readFileSync(`${__dirname}/fixtures/emojiWithoutShortnames.html`, 'utf8');

// Kissing Face With Smiling Eyes
// with snake case shortname
const emojiWithWeirdShortname = fs.readFileSync(`${__dirname}/fixtures/emojiWithWeirdShortname.html`, 'utf8');

const emojiWithModifiers = fs.readFileSync(`${__dirname}/fixtures/emojiWithModifiers.html`, 'utf8');

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
    beforeEach(() => {
      parseEmojiSuccessSpy.reset();
    });

    describe('emoji has shortname', () => {
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
          'modifiers': [],
          'shortnames': [
            'grinning',
          ],
          'shortname': 'grinning',
          'category': 'people',
          'unicode': '1f600',
        });
      });
    });

    describe('emoji doesnt have shortname', () => {
      it('use name as shortname', () => {

        expect(parseEmojiSuccessSpy.callCount).to.equal(0);
        parser.parseEmoji({
          'fullName': 'Grinning Face With Star Eyes Emoji',
          'name': 'grinning-face-with-star-eyes',
          'symbol': '🤩',
          'category': 'people',
          'url': 'https://emojipedia.org/grinning-face-with-star-eyes/',
        }, emojiWithoutShortnamesHTML);

        expect(parseEmojiSuccessSpy.callCount).to.equal(1);
        expect(parseEmojiSuccessSpy.args[0][0]).to.equal('grinning-face-with-star-eyes');
        expect(parseEmojiSuccessSpy.args[0][1]).to.deep.equal({
          'fullName': 'Grinning Face With Star Eyes Emoji',
          'name': 'grinning-face-with-star-eyes',
          'symbol': '🤩',
          'modifiers': [],
          'shortnames': [
            'grinning-face-with-star-eyes',
          ],
          'shortname': 'grinning-face-with-star-eyes',
          'category': 'people',
          'unicode': '1f929',
        });
      });
    });

    describe('emoji has weird shortname', () => {
      it('format properly shortname', () => {
        expect(parseEmojiSuccessSpy.callCount).to.equal(0);
        parser.parseEmoji({
          'fullName': 'Kissing Face With Smiling Eyes',
          'name': 'kissing-face-with-smiling-eyes',
          'symbol': '😙',
          'category': 'people',
          'url': 'https://emojipedia.org/kissing-face-with-smiling-eyes/',
        }, emojiWithWeirdShortname);

        expect(parseEmojiSuccessSpy.callCount).to.equal(1);
        expect(parseEmojiSuccessSpy.args[0][0]).to.equal('kissing-face-with-smiling-eyes');
        expect(parseEmojiSuccessSpy.args[0][1]).to.deep.equal({
          'fullName': 'Kissing Face With Smiling Eyes',
          'name': 'kissing-face-with-smiling-eyes',
          'symbol': '😙',
          'modifiers': [],
          'shortnames': [
            'kissing-smiling-eyes',
          ],
          'shortname': 'kissing-smiling-eyes',
          'category': 'people',
          'unicode': '1f619',
        });
      });
    });

    describe('emoji has modifiers', () => {
      it('parse the modifiers', () => {

        expect(parseEmojiSuccessSpy.callCount).to.equal(0);
        parser.parseEmoji({
          'fullName': 'Middle Finger',
          'name': 'reversed-hand-with-middle-finger-extended',
          'symbol': '🖕',
          'category': 'people',
          'url': 'https://emojipedia.org/reversed-hand-with-middle-finger-extended/',
        }, emojiWithModifiers);

        expect(parseEmojiSuccessSpy.callCount).to.equal(1);
        expect(parseEmojiSuccessSpy.args[0][0]).to.equal('reversed-hand-with-middle-finger-extended');
        expect(parseEmojiSuccessSpy.args[0][1]).to.deep.equal({
          'fullName': 'Middle Finger',
          'name': 'reversed-hand-with-middle-finger-extended',
          'symbol': '🖕',
          'modifiers': [
            {
              'category': 'people',
              'fullName': 'Middle Finger: Light Skin Tone',
              'name': 'reversed-hand-with-middle-finger-extended-type-1-2',
              'parent': 'reversed-hand-with-middle-finger-extended',
              'symbol': '🖕🏻',
              'url': 'https://emojipedia.org/reversed-hand-with-middle-finger-extended-type-1-2/',
            },
            {
              'category': 'people',
              'fullName': 'Middle Finger: Medium-Light Skin Tone',
              'name': 'reversed-hand-with-middle-finger-extended-type-3',
              'parent': 'reversed-hand-with-middle-finger-extended',
              'symbol': '🖕🏼',
              'url': 'https://emojipedia.org/reversed-hand-with-middle-finger-extended-type-3/',
            },
            {
              'category': 'people',
              'fullName': 'Middle Finger: Medium Skin Tone',
              'name': 'reversed-hand-with-middle-finger-extended-type-4',
              'parent': 'reversed-hand-with-middle-finger-extended',
              'symbol': '🖕🏽',
              'url': 'https://emojipedia.org/reversed-hand-with-middle-finger-extended-type-4/',
            },
            {
              'category': 'people',
              'fullName': 'Middle Finger: Medium-Dark Skin Tone',
              'name': 'reversed-hand-with-middle-finger-extended-type-5',
              'parent': 'reversed-hand-with-middle-finger-extended',
              'symbol': '🖕🏾',
              'url': 'https://emojipedia.org/reversed-hand-with-middle-finger-extended-type-5/',
            },
            {
              'category': 'people',
              'fullName': 'Middle Finger: Dark Skin Tone',
              'name': 'reversed-hand-with-middle-finger-extended-type-6',
              'parent': 'reversed-hand-with-middle-finger-extended',
              'symbol': '🖕🏿',
              'url': 'https://emojipedia.org/reversed-hand-with-middle-finger-extended-type-6/',
            },
          ],
          'shortnames': [
            'reversed-hand-with-middle-finger-extended',
          ],
          'shortname': 'reversed-hand-with-middle-finger-extended',
          'category': 'people',
          'unicode': '1f595',
        })
        ;
      });
    });
  });
});