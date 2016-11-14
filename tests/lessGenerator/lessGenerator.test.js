'use strict';

const fs = require('fs');
const lessGenerator = require('../../index.js').lessGenerator;
const emojis = require('./datas/emojis.json');
const spritePath = [__dirname, 'emojis.png'].join('/');

describe('lessGenerator', () => {
  it('generate less file', (done) => {
    const resultFilePath = [__dirname, 'emojis.less'].join('/');
    let fileContent = '';
    lessGenerator(spritePath, emojis, resultFilePath);
    expect(function() {
      fileContent = fs.readFileSync(resultFilePath, 'utf8');
    }).to.not.throw(Error);

    expect(fileContent.indexOf(`
.idz-emoji-grinning-face {
    background-position: 0 0;
}`)).to.not.equal(-1);
    expect(fileContent.indexOf(`
.idz-emoji-winking-face {
    background-position: 24px 0;
}`)).to.not.equal(-1);
    expect(fileContent.indexOf(`
    background-size: 48px 24px;
`)).to.not.equal(-1);

    fs.unlinkSync([__dirname, 'emojis.less'].join('/'));
    done();
  });
});
