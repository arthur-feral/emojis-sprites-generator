import {
  size,
} from 'lodash';
import fs from 'fs';
import EventEmitter from 'eventemitter3';
import Collector from './collector';
import {
  PARSER_PARSE_EMOJI_SUCCESS,
  PARSER_PARSE_CATEGORIES_SUCCESS,
  PARSER_THEMES_FOUND,
} from '../constants';

const baseConfig = {
  destination: `${process.cwd()}/emojis`,
  size: 48,
  fromCache: false,
  prefix: 'emojis',
  preproc: 'sass',
};

const emitter = new EventEmitter();
let collector = Collector(baseConfig, emitter);

const emojiParsed = require(`${process.cwd()}/tests/jsons/grinning-face.json`);

describe('Collector', () => {
  describe('PARSER_PARSE_EMOJI_SUCCESS', () => {
    it('add the emoji newly parsed the store', () => {
      emitter.emit(PARSER_PARSE_EMOJI_SUCCESS, emojiParsed);
      expect(collector.getEmojis()).to.deep.equal({
        'grinning-face': emojiParsed,
      });
    });
  });

  describe('PARSER_PARSE_CATEGORIES_SUCCESS', () => {
    it('add the emoji newly parsed the store', () => {
      emitter.emit(PARSER_PARSE_CATEGORIES_SUCCESS, [
        {
          'fullName': 'Smileys & People',
          'name': 'people',
          'symbol': '😃',
          'url': 'https://emojipedia.org/people/',
        },
        {
          'fullName': 'Food',
          'name': 'food',
          'symbol': '🍟',
          'url': 'https://emojipedia.org/food/',
        },
      ]);
      expect(collector.getCategories()).to.deep.equal({
        people: {
          'fullName': 'Smileys & People',
          'name': 'people',
          'symbol': '😃',
          'url': 'https://emojipedia.org/people/',
        },
        food: {
          'fullName': 'Food',
          'name': 'food',
          'symbol': '🍟',
          'url': 'https://emojipedia.org/food/',
        },
      });
    });
  });
});