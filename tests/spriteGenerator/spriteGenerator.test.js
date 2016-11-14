'use strict';

const sizeOf = require('image-size');
const fs = require('fs');
const spriteGenerator = require('../../index.js').spriteGenerator;
const resultFile = `${__dirname}/emojis.png`;

describe('spriteGenerator', () => {
  it('creates a sprite image', (done) => {
    spriteGenerator(`${__dirname}/images/`, resultFile).then(() => {
      expect(function() {
        fs.readFileSync(resultFile);
      }).to.not.throw(Error);
      fs.unlinkSync(resultFile);
      done();
    }).catch(done);
  });

  it('should have specified size', (done) => {
    spriteGenerator(`${__dirname}/images/`, resultFile, 24).then(() => {
      const dimensions = sizeOf(resultFile);
      expect(dimensions.width).to.equal(48);
      expect(dimensions.height).to.equal(24);
      fs.unlinkSync(resultFile);
      done();
    }).catch(done);
  });

  // should test error cases
});
