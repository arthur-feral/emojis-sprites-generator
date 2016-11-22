'use strict';

const fs = require('fs');
const superagent = require('superagent');
const superagentConfig = require('../mocks/superagent-mock-config');
const logger = require('../../lib/logger');
const superagentMock = require('superagent-mock')(superagent, superagentConfig);
const crawler = require('../../lib/crawler')(logger);
const scrapper = require('../../lib/scrapper')(superagent, crawler, logger);
const emojisForCategory = require('../mocks/jsons/emojisForCategory.json');
const emojipediaComplete = require('../mocks/jsons/emojipediaComplete.json');

describe('scrapper', () => {
  after(() => {
    superagentMock.unset();
  });

  describe('#scrapIndex', () => {
    describe('without cache', () => {
      it('fetch html from index page', (done) => {
        scrapper.scrapIndex(false).then((datas) => {
          expect(datas.length).to.equal(1);
          expect(datas[0]).to.deep.equal({
            name: 'people',
            url: '/people/',
            fullName: 'Smileys & People'
          });
          done();
        }).catch(done);
      });
    });

    describe('with cache', () => {

    });
  });

  describe('#scrapCategories', () => {
    describe('without cache', () => {
      it('fetch html from categories page', (done) => {
        scrapper.scrapCategories(false, [{
          name: 'people',
          url: '/people/',
          fullName: 'Smileys & People'
        }]).then((datas) => {
          assert.isTrue(_.has(datas, 'people'));
          expect(datas.people.name).to.equal('people');
          expect(datas.people.fullName).to.equal('Smileys & People');
          expect(datas.people.url).to.equal('/people/');
          expect(datas.people.emojis.length).to.equal(3);
          done();
        }).catch(done);
      });
    });

    describe('with cache', () => {

    });
  });

  describe('#scrapEmojiPage', () => {
    describe('without cache', () => {
      it('fetch html from emoji page', (done) => {
        scrapper.scrapEmojiPage(false, {
          "url": "/grinning-face/",
          "shortname": "grinning-face",
          "char": "😀",
          "category": "people",
          "fullName": "Grinning Face"
        }, 0, false).then((datas) => {
          expect(datas.shortname).to.equal('grinning-face');
          expect(datas.category).to.equal('people');
          expect(datas.fullName).to.equal('Grinning Face');
          expect(datas.index).to.equal(0);
          expect(_.size(datas.themes)).to.equal(11);
          expect(datas.themes.apple).to.match(/http:\/\/emojipedia/);
          done();
        }).catch(done);
      });
    });

    describe('with cache', () => {

    });
  });

  describe('#scrapEmojis', () => {
    describe('without cache', () => {
      it('fetch html from all emojis pages', (done) => {
        scrapper.scrapEmojis(false, emojisForCategory).then((datas) => {
          expect(datas).to.deep.equal(emojipediaComplete);
          done();
        }).catch(done);
      });
    });

    describe('with cache', () => {

    });
  });

  describe('#scrap', () => {
    describe('without cache', () => {
      let destPath = __dirname;
      after(()=> {
        fs.unlinkSync([destPath, 'emojis.json'].join('/'));
      });

      it('Build emojis datas json file', (done) => {
        scrapper.scrap({
          fromCache: false,
          destination: destPath
        }).then((datas) => {
          expect(datas).to.deep.equal(emojipediaComplete);
          done();
        }).catch(done);
      });
    });

    describe('with cache', () => {

    });
  });
});
