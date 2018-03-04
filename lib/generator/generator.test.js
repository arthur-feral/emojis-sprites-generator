import path from 'path';
import fs from 'fs-extra';
import EventEmitter from 'eventemitter3';
import GeneratorFactory from './generator';

const baseConfig = {
  destination: `${process.cwd()}/emojis`,
  size: 48,
  fromCache: false,
  prefix: 'emojis',
  preproc: 'sass',
};

const emitter = new EventEmitter();
let generator = GeneratorFactory(baseConfig, emitter);

const parseImageSuccessSpy = sinon.spy();

emitter.on('PARSER_PARSE_IMAGE_SUCCESS', parseImageSuccessSpy);

const emojiJSON = require(`${process.cwd()}/tests/jsons/grinning-face.json`);
const imageDone = fs.readFileSync(`${process.cwd()}/tests/images/grinning-face.png`, 'utf8');

describe('Generator', () => {
  before(() => {
    fs.copySync(
      path.resolve(process.cwd(), './tests/images/grinning-face_raw.png'),
      path.resolve(process.env.TEMP_IMAGES_PATH, './images/apple/people/grinning-face_raw.png'),
    );
  });
  describe('generateImage', () => {
    it('generate the computed image from raw image', async () => {
      expect(parseImageSuccessSpy.callCount).to.equal(0);
      const result = await generator.generateImage(emojiJSON, 'apple');
      expect(parseImageSuccessSpy.callCount).to.equal(1);
    });
  });
});