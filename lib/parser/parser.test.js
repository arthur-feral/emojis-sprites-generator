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

const indexHTML = fs.readFileSync(`${__dirname}/index.html`, 'utf8');
//const emojipediaMainPage = fs.readFileSync([__dirname, '../index.html'].join('/'), 'utf8');
//const people = fs.readFileSync([__dirname, '../mocks/html/people.html'].join('/'), 'utf8');
//const fatherChristmas = fs.readFileSync([__dirname, '../mocks/html/father-christmas.html'].join('/'), 'utf8');
//const griningFace = fs.readFileSync([__dirname, '../mocks/html/grinning-face.html'].join('/'), 'utf8');

const themes = ['Apple', 'emojidex', 'EmojiOne', 'Emojipedia', 'Facebook', 'Google', 'HTC', 'Instagram', 'LG', 'Messenger', 'Microsoft', 'Mozilla', 'Samsung', 'Slack', 'Snapchat', 'Sponsored', 'Telegram', 'Twitter', 'Viber', 'WhatsApp', 'Yo Status'];

describe('Parser', () => {

  describe('#parseCategories', () => {
    it('parse categories data from main page', () => {
      const categories = parser.parseCategories(indexHTML);
      expect();
    });
  });
});