'use strict';

const superagentMock = require('superagent-mock')(superagent, config, logger);
const fs = require('fs');
const scrapper = require('../../lib/scrapper');

describe('scrapper', () => {
  after(() => {
    superagentMock.unset();
  });

  it('scrap a theme', (done) => {
    scrapper().then((result) => {

      done();
    }).catch(done);
  });
});
