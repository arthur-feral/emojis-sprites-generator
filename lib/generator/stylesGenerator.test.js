import fs from 'fs-extra';
import StylesGenerator from './stylesGenerator';
import EventEmitter from 'eventemitter3';

const baseConfig = {
  destination: `emojis`,
  size: 48,
  fromCache: false,
  prefix: 'emojis',
  preproc: 'sass',
};

const TEMP_FILES_PATH = process.env.TEMP_FILES_PATH;
const STYLES_PATH = `${TEMP_FILES_PATH}/styles`;

const emitter = new EventEmitter();
const sassGenerator = StylesGenerator(baseConfig, emitter);
const coordinatesJSON = require(`${process.cwd()}/tests/jsons/coordinates.json`);
const emojisFullPeopleJSON = require(`${process.cwd()}/tests/jsons/emojisFullForCategory.json`);
const emojisNames = _.map(emojisFullPeopleJSON.people.emojis, e => e.name);
const sassResult = fs.readFileSync(`${STYLES_PATH}/apple_.scss`, 'utf8');

describe('StylesGenerator', () => {
  describe('generateStyle', () => {
    it('generate the stylesheet file', async () => {
      const result = await sassGenerator('apple', emojisNames, {
        width: 144,
        height: 144,
      }, coordinatesJSON);

      expect(result).to.equal(sassResult);
    });
  });
});
