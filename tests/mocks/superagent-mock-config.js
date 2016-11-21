'use strict';

const fs = require('fs');
const emojipediaMainPage = fs.readFileSync([__dirname, 'html/emojipediaMainPage.html'].join('/'), 'utf8');
const emojipediaCategoryPeople = fs.readFileSync([__dirname, 'html/emojipediaCategoryPeople.html'].join('/'), 'utf8');
const emojipediaEmojiWithModifier = fs.readFileSync([__dirname, 'html/emojipediaEmojiWithModifier.html'].join('/'), 'utf8');
const emojipediaEmojiMultiple = fs.readFileSync([__dirname, 'html/emojipediaEmojiMultiple.html'].join('/'), 'utf8');

module.exports = [
  {
    /**
     * regular expression of URL
     */
    pattern: 'http://emojipedia.org(*)',

    /**
     * returns the data
     *
     * @param match array Result of the resolution of the regular expression
     */
    fixtures: function(match) {
      if (match[1] === '/') {
        return emojipediaMainPage;
      }

      if (match[1] === '/people/') {
        return emojipediaEmojiWithModifier;
      }

      if (match[1] === '/father-christmas/') {
        return emojipediaEmojiWithModifier;
      }

      if (match[1] === '/family-woman-woman-boy/') {
        return emojipediaEmojiMultiple;
      }

      return '';
    },

    /**
     * returns the result of the GET request
     *
     * @param match array Result of the resolution of the regular expression
     * @param data  mixed Data returns by `fixtures` attribute
     */
    get: function(match, data) {
      return {
        body: data
      };
    }
  }
];
