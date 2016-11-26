'use strict';

const stylesheetGenerator = require('../../lib/generator/stylesheetGenerator');

describe('stylesheetGenerator', () => {
  describe('#generate', () => {
    it('throw error if provided preprocessor is unknown', (done) => {
      expect(function() {
        stylesheetGenerator.generate('apple', 'plop', 'emoji', {
          width: 24,
          height: 24
        }, 'path');
      }).to.throw('[stylesheetGenerator] unknown preprocessor type');
      done();
    });
  });
});
