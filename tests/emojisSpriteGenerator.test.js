'use strict';

const sizeOf = require('image-size');
const fs = require('fs');
const emojisSpriteGenerator = require('../index.js');
const resultFile = 'tests/emojis.png';

describe('emojisSpriteGenerator', () => {
  it('creates a sprite image', (done) => {
    emojisSpriteGenerator('tests/images/', resultFile).then(() => {
      expect(function() {
        fs.readFileSync('tests/emojis.png');
      }).to.not.throw(Error);
      fs.unlinkSync(resultFile);
      done();
    }).catch(done);
  });

  it('should have specified size', (done) => {
    emojisSpriteGenerator('tests/images/', resultFile, 24).then(() => {
      const dimensions = sizeOf(resultFile);
      expect(dimensions.width).to.equal(48);
      expect(dimensions.height).to.equal(24);
      fs.unlinkSync(resultFile);
      done();
    }).catch(done);
  });

  // should test error cases
});
