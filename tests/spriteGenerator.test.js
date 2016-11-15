'use strict';

const fs = require('fs');
const generator = require('../index');
const sizeOf = require('image-size');
const imagesPath = [__dirname, 'images'].join('/');
const destinationPath = __dirname;
const emojis = require('./lessGenerator/datas/emojis.json');

const spritePath = [destinationPath, 'emojis.png'].join('/');
const lessPath = [destinationPath, 'emojis.less'].join('/');

let config = {};

describe('generator', () => {
  describe('bad config', () => {
    it('throw A valid path for emojis images is required', (done) => {
      expect(() => {
        generator(config);
      }).to.throw(/A valid path for emojis images is required/);
      done();
    });

    it('throw The emojis list is required', (done) => {
      config = {
        imagesPath: imagesPath
      };
      expect(() => {
        generator(config);
      }).to.throw(/The emojis list is required/);
      done();
    });
  });

  describe('Good config', () => {
    before(() => {
      config.emojis = emojis;
      config.destinationPath = destinationPath;
    });

    after(() => {
      fs.unlinkSync(spritePath);
      fs.unlinkSync(lessPath);
    });

    it('gererate sprite image', (done) => {
      let image = null;
      generator(config).then(() => {
        expect(() => {
          image = fs.readFileSync(spritePath);
        }).to.not.throw(Error);
        let imageSize = sizeOf(image);
        expect(imageSize.width).to.equal(48);
        expect(imageSize.height).to.equal(24);
        done();
      }).catch(done);
    });

    it('generate less file', (done) => {
      let less = '';
      expect(() => {
        less = fs.readFileSync(lessPath, 'utf8');
      }).to.not.throw(Error);

      expect(less.indexOf(`@emojiCharSize: 24px;`)).to.not.equal(-1);
      expect(less.indexOf(`background: transparent url("${spritePath}") 0 0 no-repeat;`)).to.not.equal(-1);
      expect(less.indexOf(`background-size: 48px 24px;`)).to.not.equal(-1);
      expect(less.indexOf(`.idz-emoji-grinning-face {`)).to.not.equal(-1);
      expect(less.indexOf(`background-position: 0 0;`)).to.not.equal(-1);
      expect(less.indexOf(`.idz-emoji-winking-face {`)).to.not.equal(-1);
      expect(less.indexOf(`background-position: 24px 0;`)).to.not.equal(-1);

      done();
    });
  });
});
