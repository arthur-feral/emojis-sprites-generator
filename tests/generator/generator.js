'use strict';

const generator = require('../../lib').generator;
const scrapper = require('../../lib').scrapper;
const sizeOf = require('image-size');
const imagesPath = [__dirname, 'images'].join('/');
const destinationPath = __dirname;
const emojis = require('./lessGenerator/datas/emojis.json');
const fse = require('fs-extra')
const finalFolder = [destinationPath, 'apple'].join('/');
const spritePath = [destinationPath, 'apple/apple.png'].join('/');
const lessPath = [destinationPath, 'apple/apple.less'].join('/');
const datasPath = [destinationPath, 'apple/apple.json'].join('/');
const grinningFaceTempImagePath = '/tmp/cache/images/apple/people/grinning-face_raw.png';
const winkingFaceTempImagePath = '/tmp/cache/images/apple/people/winking-face_raw.png';

describe('generator', () => {
  before(() => {
    fse.copySync([imagesPath, 'grinning-face_raw.png'].join('/'), grinningFaceTempImagePath);
    fse.copySync([imagesPath, 'winking-face_raw.png'].join('/'), winkingFaceTempImagePath);
  });

  after(() => {
    fse.unlinkSync(grinningFaceTempImagePath);
    fse.unlinkSync(winkingFaceTempImagePath);
  });

  describe('Good config', () => {
    before(() => {
    });

    after(() => {
      fse.unlinkSync(finalFolder);
    });

    it('gererate sprite image', (done) => {
      let image = null;
      generator.generateSprite('apple', emojis, 24, destinationPath).then(() => {
        expect(() => {
          image = fse.readFileSync(spritePath);
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
        less = fse.readFileSync(lessPath, 'utf8');
      }).to.not.throw(Error);

      expect(less.indexOf(`@emojiCharSize: 24px;`)).to.not.equal(-1);
      expect(less.indexOf(`background: transparent url("${spritePath}") 0 0 no-repeat;`)).to.not.equal(-1);
      expect(less.indexOf(`background-size: 48px 24px;`)).to.not.equal(-1);
      expect(less.indexOf(`.idz-emoji-grinning-face {`)).to.not.equal(-1);
      expect(less.indexOf(`background-position: 0 0;`)).to.not.equal(-1);
      expect(less.indexOf(`.idz-emoji-winking-face {`)).to.not.equal(-1);
      expect(less.indexOf(`background-position: -24px 0;`)).to.not.equal(-1);

      done();
    });
  });
});
