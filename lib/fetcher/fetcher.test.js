import EventEmitter from 'eventemitter3';
import FetcherFactory from './fetcher';
import fs from 'fs-extra';

const baseConfig = {
  destination: `${process.cwd()}/emojis`,
  size: 24,
  fromCache: false,
  prefix: 'emojis',
  preproc: 'sass',
};

const emitter = new EventEmitter();
let fetcher = FetcherFactory(baseConfig, emitter);
const fetchCategoriesSuccessSpy = sinon.spy();
const fetchCategorySuccessSpy = sinon.spy();
const fetchEmojiSuccessSpy = sinon.spy();
const fetchImageSuccessSpy = sinon.spy();

const indexHTML = fs.readFileSync(`${__dirname}/fixtures/index.html`, 'utf8');
const categoryHTML = fs.readFileSync(`${__dirname}/fixtures/people.html`, 'utf8');
const emojiHTML = fs.readFileSync(`${__dirname}/fixtures/emoji.html`, 'utf8');
const imageBody = fs.readFileSync(`${__dirname}/fixtures/emoji.png`, 'utf8');

emitter.on('FETCHER_FETCH_CATEGORIES_SUCCESS', fetchCategoriesSuccessSpy);
emitter.on('FETCHER_FETCH_CATEGORY_SUCCESS', fetchCategorySuccessSpy);
emitter.on('FETCHER_FETCH_EMOJI_SUCCESS', fetchEmojiSuccessSpy);
emitter.on('FETCHER_FETCH_IMAGE_SUCCESS', fetchImageSuccessSpy);

describe('Fetcher', () => {

  describe('#fetchCategories', () => {
    it('fetch categories data from main page', async () => {
      expect(fetchCategoriesSuccessSpy.callCount).to.equal(0);

      const categories = await fetcher.fetchCategories();
      expect(categories).to.equal(indexHTML);

      expect(fetchCategoriesSuccessSpy.callCount).to.equal(1);
    });
  });

  describe('#fetchCategory', () => {
    it('fetch emojis list from a category page', async () => {
      expect(fetchCategorySuccessSpy.callCount).to.equal(0);

      const category = await fetcher.fetchCategory({
        'fullName': 'Smileys & People',
        'name': 'people',
        'symbol': '😃',
        'url': 'https://emojipedia.org/people/',
      });
      expect(category).to.equal(categoryHTML);

      expect(fetchCategorySuccessSpy.callCount).to.equal(1);
    });
  });

  describe('#fetchEmoji', () => {
    it('fetch emoji page', async () => {
      expect(fetchEmojiSuccessSpy.callCount).to.equal(0);

      const emoji = await fetcher.fetchEmoji(
        {
          'fullName': 'Smileys & People',
          'name': 'people',
          'symbol': '😃',
          'url': 'https://emojipedia.org/people/',
        },
        {
          'fullName': 'Middle Finger',
          'name': 'reversed-hand-with-middle-finger-extended',
          'symbol': '🖕',
          'category': 'people',
          'url': 'https://emojipedia.org/reversed-hand-with-middle-finger-extended/',
        });
      expect(emoji).to.equal(emojiHTML);

      expect(fetchEmojiSuccessSpy.callCount).to.equal(1);
    });
  });

  describe('#fetchImage', () => {
    it('fetch categories data from main page', async () => {
      expect(fetchImageSuccessSpy.callCount).to.equal(0);

      const image = await fetcher.fetchImage(
        {
          'fullName': 'Smileys & People',
          'name': 'people',
          'symbol': '😃',
          'url': 'https://emojipedia.org/people/',
        },
        {
          'fullName': 'Grinning Face',
          'name': 'grinning-face',
          'symbol': '😀',
          'modifiers': [],
          'shortnames': [
            'grinning',
          ],
          'shortname': 'grinning',
          'themes': {
            'apple': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/apple/118/grinning-face_1f600.png',
            'emojidex': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/emojidex/112/grinning-face_1f600.png',
            'emojione': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/emoji-one/104/grinning-face_1f600.png',
            'facebook': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/facebook/111/grinning-face_1f600.png',
            'google': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/google/119/grinning-face_1f600.png',
            'htc': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/htc/122/grinning-face_1f600.png',
            'lg': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/lg/57/grinning-face_1f600.png',
            'messenger': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/facebook/65/grinning-face_1f600.png',
            'microsoft': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/microsoft/106/grinning-face_1f600.png',
            'mozilla': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/mozilla/36/grinning-face_1f600.png',
            'samsung': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/samsung/128/grinning-face_1f600.png',
            'twitter': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/twitter/131/grinning-face_1f600.png',
            'whatsapp': 'https://emojipedia-us.s3.amazonaws.com/thumbs/120/whatsapp/116/grinning-face_1f600.png',
          },
          'category': 'people',
          'unicode': '1f600',
        },
        'apple',
        'https://emojipedia-us.s3.amazonaws.com/thumbs/120/apple/118/grinning-face_1f600.png',
      );

      expect(fetchImageSuccessSpy.callCount).to.equal(1);
    });
  });
});