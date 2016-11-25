'use strict';

// const os = require('os');
// const cachePath = os.tmpdir();
const _ = require('lodash');
const cachePath = [process.cwd(), 'cache'].join('/');
const sizeOf = require('image-size');
const fs = require('fs-extra');
const logger = require('../../../lib/logger');
const imageGenerator = require('../../../lib/generator/imageGenerator')(logger);
const grinningFaceRawPath = [__dirname, 'images/grinning-face_raw.png'].join('/');
const grinningFacePath = [cachePath, 'images/grinning-face.png'].join('/');
const baseImagePath = [__dirname, 'images/base.png'].join('/');
const baseImageCachePath = [cachePath, 'base.png'].join('/');
const spriteDestination = [cachePath].join('/');
const emojisList = require('../../mocks/jsons/emojipediaComplete.json').people.emojis;
let emojisShortnames = [];

_.each(emojisList, (emoji) => {
  emojisShortnames.push(emoji.shortname);
  if (_.has(emoji, 'modifiers')) {
    emojisShortnames = emojisShortnames.concat(_.map(emoji.modifiers, (modifier) => modifier.shortname));
  }
});


describe('imageGenerator', () => {
  before(() => {
    try {
      fs.accessSync(`${cachePath}/images/apple/people/`, fs.F_OK);
    } catch (error) {
      fs.mkdirpSync(`${cachePath}/images/apple/people/`);
    }
    fs.copySync(baseImagePath, baseImageCachePath);
    _.each(emojisShortnames, (shortname) => {
      fs.copySync(`${__dirname}/images/${shortname}.png`, `${cachePath}/images/apple/people/${shortname}.png`);
    });
  });
  after(() => {
    fs.unlinkSync(baseImageCachePath);
    fs.unlinkSync(grinningFacePath);
    fs.unlinkSync([spriteDestination, '/apple/apple.png'].join('/'));
    _.each(emojisShortnames, (shortname) => {
      fs.unlinkSync(`${cachePath}/images/apple/people/${shortname}.png`);
    });
  });

  describe('#generateBaseImage', () => {
    it('generate an emoji from base', (done) => {
      imageGenerator.generateBaseImage(24).then((path) => {
        let finalPath = [process.cwd(), 'cache/images/base.png'].join('/');
        expect(path).to.equal(finalPath);
        expect(function() {
          fs.accessSync(finalPath, fs.F_OK);
        }).to.not.throw(Error);

        let dimensions = sizeOf(finalPath);
        expect(dimensions.height).to.equal(24);
        done();
      }).catch(done);
    });
  });

  describe('#generateImage', () => {
    it('generate an emoji from base', (done) => {
      imageGenerator.generateImage(24, grinningFaceRawPath, grinningFacePath).then((path) => {
        expect(path).to.equal(grinningFacePath);
        expect(function() {
          fs.accessSync(grinningFacePath, fs.F_OK);
        }).to.not.throw(Error);

        let dimensions = sizeOf(grinningFacePath);
        expect(dimensions.height).to.equal(24);
        done();
      }).catch(done);
    });
  });

  describe('#generateSprite', () => {
    it('generate a sprite', (done) => {
      imageGenerator.generateSprite('apple', emojisList, spriteDestination).then((spriteDimension) => {
        expect(function() {
          fs.accessSync(`${spriteDestination}/apple/apple.png`, fs.F_OK);
        }).to.not.throw(Error);
        expect(spriteDimension.height).to.equal(24);
        expect(spriteDimension.width).to.equal((24 * emojisShortnames.length));
        done();
      }).catch(done);
    });
  });

});
