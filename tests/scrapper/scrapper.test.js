'use strict';
const fs = require('fs');
const scrapper = require('../../lib/scrapper');
const emojipediaMainPage = fs.readFileSync([__dirname, 'html/emojipediaMainPage.html'].join('/'), 'utf8');

describe('scrapper', () => {
  it('scrap a theme', (done) => {
    scrapper().then((result) => {

      done();
    }).catch(done);
  });
});
