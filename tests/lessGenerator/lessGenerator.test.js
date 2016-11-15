'use strict';

const fs = require('fs');
const lessGenerator = require('../../lib/lessGenerator');
const emojis = require('./datas/emojis.json');
const spritePath = [__dirname, 'emojis.png'].join('/');

describe('lessGenerator', () => {
  describe('#base', () => {
    it('generate base less file', (done) => {
      const result = lessGenerator.base(spritePath, 2, 24);
      expect(result.indexOf(`@emojiCharSize: 24px;`)).to.not.equal(-1);
      expect(result.indexOf(`background: transparent url("${__dirname}/emojis.png") 0 0 no-repeat;`)).to.not.equal(-1);
      expect(result.indexOf(`background-size: 48px 24px;`)).to.not.equal(-1);
      done();
    });
  });

  describe('#emoji', () => {
    it('generate emoji less rule', (done) => {
      let result = lessGenerator.emoji('grinning-face', 0, 24);
      expect(result.indexOf(`.idz-emoji-grinning-face {`)).to.not.equal(-1);
      expect(result.indexOf(`background-position: 0 0;`)).to.not.equal(-1);

      result = lessGenerator.emoji('winking-face', 1, 24);
      expect(result.indexOf(`.idz-emoji-winking-face {`)).to.not.equal(-1);
      expect(result.indexOf(`background-position: 24px 0;`)).to.not.equal(-1);

      done();
    });
  });
});
