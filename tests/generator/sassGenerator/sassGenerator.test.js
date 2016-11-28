'use strict';

const fs = require('fs');
const when = require('when');
const sassGenerator = require('../../../lib/generator/sassGenerator');
const spritePath = [__dirname, 'emojis.png'].join('/');
const emojisJSON = require('../../mocks/jsons/emojipediaComplete.json');
const emojis = _.map(emojisJSON.people.emojis, (emoji) => emoji);

describe('sassGenerator', () => {
  describe('#base', () => {
    it('generate base sass file', (done) => {
      const result = sassGenerator.base('emoji', spritePath, 48, 24);
      expect(result.indexOf(`$emojiCharSize: 24px;`)).to.not.equal(-1);
      expect(result.indexOf(`background: transparent url("${__dirname}/emojis.png") 0 0 no-repeat;`)).to.not.equal(-1);
      expect(result.indexOf(`background-size: 48px 24px;`)).to.not.equal(-1);
      done();
    });
  });

  describe('#emoji', () => {
    it('generate emoji scss rule', (done) => {
      let result = sassGenerator.emoji('emoji', 'grinning-face', 0);
      expect(result.indexOf(`.emoji-grinning-face {`)).to.not.equal(-1);
      expect(result.indexOf(`background-position: 0px top;`)).to.not.equal(-1);

      result = sassGenerator.emoji('emoji', 'winking-face', -24);
      expect(result.indexOf(`.emoji-winking-face {`)).to.not.equal(-1);
      expect(result.indexOf(`background-position: -24px top;`)).to.not.equal(-1);

      done();
    });
  });

  describe('#generate', () => {
    after(() => {
      fs.unlinkSync(`${__dirname}/apple/apple.scss`);
    });

    it('generate sass stylesheet', (done) => {
      let lessContent;
      sassGenerator.generate('apple', 'prefix', emojis, {width: 152, height: 25}, __dirname).then(() => {
        expect(function() {
          lessContent = fs.readFileSync(`${__dirname}/apple/apple.scss`, 'utf8');
        }).to.not.throw(Error);

        expect(lessContent.indexOf(`.prefix-winking-face {`)).to.not.equal(-1);
        expect(lessContent.indexOf(`background-position: -24px top`)).to.not.equal(-1);

        done();
      }).catch(done);
    });
  });
});
