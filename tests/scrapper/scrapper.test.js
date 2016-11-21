'use strict';

const fs = require('fs');
const superagentMock = require('superagent-mock')(superagent, superagentConfig, ()=> {
});
const crawler = require('../..lib/crawler')();
const scrapper = require('../../lib/scrapper')(superagentMock, crawler);

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
