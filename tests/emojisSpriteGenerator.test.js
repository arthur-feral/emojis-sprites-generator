'use strict';

const fs = require('fs');
const emojisSpriteGenerator = require('../index.js');
const resultFile = 'tests/emojis.png';

describe('emojisSpriteGenerator', () => {
  after(() => {
    try {
      fs.unlinkSync(resultFile);
    } catch (error) {
      console.log(error);
    }
  });

  it('creates a sprite image', (done) => {
    emojisSpriteGenerator('tests/images/', resultFile).then(() => {
      expect(function() {
        fs.readFileSync('tests/emojis.png');
      }).to.not.throw(Error);
      done();
    }).catch(done);
  });
});
