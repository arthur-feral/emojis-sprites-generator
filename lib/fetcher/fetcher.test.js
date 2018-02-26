import EventEmitter from 'eventemitter3';
import FetcherFactory from './fetcher';


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

emitter.on('FETCHER_FETCH_CATEGORIES_SUCCESS', fetchCategoriesSuccessSpy);
emitter.on('FETCHER_FETCH_CATEGORY_SUCCESS', fetchCategorySuccessSpy);
emitter.on('FETCHER_FETCH_EMOJI_SUCCESS', fetchEmojiSuccessSpy);
emitter.on('FETCHER_FETCH_IMAGE_SUCCESS', fetchImageSuccessSpy);

describe('Fetcher', () => {

  describe('#fetchCategories', () => {
    it('fetch categories data from main page', async () => {
      expect(fetchCategoriesSuccessSpy.callCount).to.equal(0);

      const categories = await fetcher.fetchCategories();
      expect(categories.status).to.deep.equal(200);
      expect(categories.type).to.deep.equal('text/html');
      expect(categories.request.url).to.equal('https://emojipedia.org');

      expect(fetchCategoriesSuccessSpy.callCount).to.equal(1);
    });
  });

  describe('#fetchCategory', () => {
    it('fetch categories data from main page', async () => {
      expect(fetchCategorySuccessSpy.callCount).to.equal(0);

      const categories = await fetcher.fetchCategory('/people/');
      expect(categories.status).to.deep.equal(200);
      expect(categories.type).to.deep.equal('text/html');
      expect(categories.request.url).to.equal('https://emojipedia.org/people/');

      expect(fetchCategorySuccessSpy.callCount).to.equal(1);
    });
  });

  describe('#fetchEmoji', () => {
    it('fetch categories data from main page', async () => {
      expect(fetchEmojiSuccessSpy.callCount).to.equal(0);

      const categories = await fetcher.fetchEmoji('/grinning-face/');
      expect(categories.status).to.deep.equal(200);
      expect(categories.type).to.deep.equal('text/html');
      expect(categories.request.url).to.equal('https://emojipedia.org/grinning-face/');

      expect(fetchEmojiSuccessSpy.callCount).to.equal(1);
    });
  });

  describe('#fetchImage', () => {
    it('fetch categories data from main page', async () => {
      expect(fetchImageSuccessSpy.callCount).to.equal(0);

      const categories = await fetcher.fetchImage('https://emojipedia-us.s3.amazonaws.com/thumbs/120/apple/118/grinning-face_1f600.png');
      expect(categories.status).to.deep.equal(200);
      expect(categories.type).to.deep.equal('image/png');
      expect(categories.request.url).to.equal('https://emojipedia-us.s3.amazonaws.com/thumbs/120/apple/118/grinning-face_1f600.png');

      expect(fetchImageSuccessSpy.callCount).to.equal(1);
    });
  });
});