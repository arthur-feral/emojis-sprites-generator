'use strict';

const fs = require('fs');
const emojipediaMainPage = fs.readFileSync([__dirname, 'html/index.html'].join('/'), 'utf8');
const people = fs.readFileSync([__dirname, 'html/people.html'].join('/'), 'utf8');
const fatherChristmas = fs.readFileSync([__dirname, 'html/father-christmas.html'].join('/'), 'utf8');
const fatherChristmas12 = fs.readFileSync([__dirname, 'html/father-christmas-type-1-2.html'].join('/'), 'utf8');
const fatherChristmas3 = fs.readFileSync([__dirname, 'html/father-christmas-type-3.html'].join('/'), 'utf8');
const fatherChristmas4 = fs.readFileSync([__dirname, 'html/father-christmas-type-4.html'].join('/'), 'utf8');
const fatherChristmas5 = fs.readFileSync([__dirname, 'html/father-christmas-type-5.html'].join('/'), 'utf8');
const fatherChristmas6 = fs.readFileSync([__dirname, 'html/father-christmas-type-6.html'].join('/'), 'utf8');
const winkingFace = fs.readFileSync([__dirname, 'html/winking-face.html'].join('/'), 'utf8');
const emojipediaEmojiMultiple = fs.readFileSync([__dirname, 'html/emojipediaEmojiMultiple.html'].join('/'), 'utf8');
const grinningFace = fs.readFileSync([__dirname, 'html/grinning-face.html'].join('/'), 'utf8');

module.exports = [
  {
    /**
     * regular expression of URL
     */
    pattern: 'http://emojipedia.org(/[a-z0-9\-]+/)?',

    /**
     * returns the data
     *
     * @param match array Result of the resolution of the regular expression
     */
    fixtures: function(match) {
      if (match[1] === '/people/') {
        return people;
      }

      if (match[1] === '/grinning-face/') {
        return grinningFace;
      }

      if (match[1] === '/winking-face/') {
        return winkingFace;
      }

      if (match[1] === '/father-christmas/') {
        return fatherChristmas;
      }

      if (match[1] === '/father-christmas-type-1-2/') {
        return fatherChristmas12;
      }

      if (match[1] === '/father-christmas-type-3/') {
        return fatherChristmas3;
      }

      if (match[1] === '/father-christmas-type-4/') {
        return fatherChristmas4;
      }

      if (match[1] === '/father-christmas-type-5/') {
        return fatherChristmas5;
      }

      if (match[1] === '/father-christmas-type-6/') {
        return fatherChristmas6;
      }

      if (match[1] === '/family-woman-woman-boy/') {
        return emojipediaEmojiMultiple;
      }

      return emojipediaMainPage;
    },

    /**
     * returns the result of the GET request
     *
     * @param match array Result of the resolution of the regular expression
     * @param data  mixed Data returns by `fixtures` attribute
     */
    get: function(match, data) {
      return {
        text: data
      };
    }
  },
  {
    pattern: 'http://emojipedia-us.s3.amazonaws.com/[a-zA-Z0-9\/-]+.png',
    fixtures: function(match) {
      return fs.readFileSync([__dirname, '../generator/imageGenerator/images/grinning-face_raw.png'].join('/'));
    },

    get: function(match, data) {
      return {
        body: data
      };
    }
  }
];
