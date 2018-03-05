import path from 'path';
import fs from 'fs-extra';
import EventEmitter from 'eventemitter3';
import GeneratorFactory from './generator';
import { GENERATOR_GENERATE_SPRITE_SUCCESS } from '../constants';

const baseConfig = {
  destination: `${process.env.TEMP_FILES_PATH}/emojis`,
  size: 48,
  fromCache: false,
  prefix: 'emojis',
  preproc: 'sass',
};

const emitter = new EventEmitter();
let generator = GeneratorFactory(baseConfig, emitter);

const parseImageSuccessSpy = sinon.spy();
const generateSpriteSuccessSpy = sinon.spy();
const generateStyleSuccessSpy = sinon.spy();

emitter.on('PARSER_PARSE_IMAGE_SUCCESS', parseImageSuccessSpy);
emitter.on('GENERATOR_GENERATE_SPRITE_SUCCESS', generateSpriteSuccessSpy);
emitter.on('GENERATOR_GENERATE_STYLE_SUCCESS', generateStyleSuccessSpy);

const coordinatesJSON = require(`${process.cwd()}/tests/jsons/coordinates.json`);
const emojiJSON = require(`${process.cwd()}/tests/jsons/grinning-face.json`);
const emojisFullPeopleJSON = require(`${process.cwd()}/tests/jsons/emojisFullForCategory.json`);
const emojisArray = _.map(emojisFullPeopleJSON.people.emojis, e => e);
let imageDone;

const tempPath = process.env.TEMP_FILES_PATH;
const imagesPath = `${tempPath}/images`;

describe('Generator', () => {
  beforeEach(() => {
    parseImageSuccessSpy.reset();
    generateSpriteSuccessSpy.reset();
    generateStyleSuccessSpy.reset();
  });
  before(() => {
    fs.copySync(
      path.resolve(process.cwd(), './tests/images/grinning-face_raw.png'),
      path.resolve(process.env.TEMP_FILES_PATH, './images/apple/people/grinning-face_raw.png'),
    );
  });

  describe('generateImage', () => {
    before(() => {
      try {
        fs.unlinkSync(`${imagesPath}/apple/people/grinning-face.png`);
      } catch (e) {

      }
    });
    after(() => {
      try {
        fs.unlinkSync(`${imagesPath}/apple/people/grinning-face.png`);
      } catch (e) {

      }
    });

    it('generate the computed image from raw image', async () => {
      expect(parseImageSuccessSpy.callCount).to.equal(0);
      const result = await generator.generateImage(emojiJSON, 'apple');
      expect(parseImageSuccessSpy.callCount).to.equal(1);
      expect(() => {
        imageDone = fs.readFileSync(`${process.cwd()}/tests/images/grinning-face.png`, 'utf8');
      }).to.not.throw();
    });
  });

  describe('generateSprite', () => {
    before(() => {
      try {
        fs.copySync(
          path.resolve(imagesPath, './apple/people/grinning-face_.png'),
          path.resolve(imagesPath, './apple/people/grinning-face.png'),
        );
        fs.unlinkSync(`${baseConfig.destination}/apple/apple.png`);
      } catch (e) {

      }
    });
    after(() => {
      try {
        fs.unlinkSync(`${imagesPath}/apple/people/grinning-face.png`);
        fs.unlinkSync(`${baseConfig.destination}/apple/apple.png`);
      } catch (e) {

      }
    });
    it('generate the computed image from raw image', async () => {
      expect(generateSpriteSuccessSpy.callCount).to.equal(0);
      const result = await generator.generateSprite('apple', emojisArray);
      expect(generateSpriteSuccessSpy.callCount).to.equal(1);
      expect(() => {
        const sprite = fs.readFileSync(`${baseConfig.destination}/apple/apple.png`, 'utf8');
      }).to.not.throw();
      expect(generateSpriteSuccessSpy.args[0][0]).to.equal('apple');
      expect(generateSpriteSuccessSpy.args[0][1]).to.deep.equal(emojisArray);
      expect(generateSpriteSuccessSpy.args[0][2].coordinates).to.deep.equal(coordinatesJSON);
    });
  });

  describe('generateStyle', () => {
    before(() => {
      try {
        fs.unlinkSync(`${baseConfig.destination}/apple/apple.scss`);
      } catch (e) {

      }
    });
    after(() => {
      try {
        fs.unlinkSync(`${baseConfig.destination}/apple/apple.scss`);
      } catch (e) {

      }
    });
    it('generate the stylesheet file', async () => {
      expect(generateStyleSuccessSpy.callCount).to.equal(0);
      const result = await generator.generateStyle('apple', emojisArray, {
        properties: {
          width: 144,
          height: 144,
        },
        coordinates: coordinatesJSON,
      });
      expect(generateStyleSuccessSpy.callCount).to.equal(1);
      expect(() => {
        const sprite = fs.readFileSync(`${baseConfig.destination}/apple/apple.scss`, 'utf8');
      }).to.not.throw();
      expect(generateStyleSuccessSpy.args[0][0]).to.deep.equal('apple');
      expect(generateStyleSuccessSpy.args[0][1]).to.deep.equal(`${baseConfig.destination}/apple/apple.scss`);
    });
  });
});