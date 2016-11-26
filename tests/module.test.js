'use strict';

const when = require('when');
const logger = require('../lib/logger');
const scrapper = {
  scrap: sinon.stub().returns(when.resolve('data')),
  scrapImages: sinon.stub().returns(when.resolve('datas'))
};
const generator = {
  generateImages: sinon.stub().returns(when.resolve('datas')),
  generateThemes: sinon.stub().returns(when.resolve('datas'))
};
const emojiModule = require('../lib/module')(scrapper, generator, logger);

describe('module', () => {
  describe('#run', () => {
    it('throw erro if the preprocessor type is not provided', () => {
      expect(function() {
        emojiModule.run({});
      }).to.throw('[getConfig] the preprocessor type is required');
    });

    it('runs the module', (done) => {
      let promise = emojiModule.run({
        preproc: 'less'
      });

      promise.then((datas) => {
        expect(datas).to.equal('datas');
        done();
      }).catch(done);
    });
  });
});
