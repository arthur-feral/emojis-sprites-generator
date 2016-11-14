'use strict';

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

  // should test error cases
});
