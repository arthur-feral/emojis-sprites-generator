'use strict';

const _ = require('lodash');
const superagent = require('superagent');
const lib = require('./lib')(superagent);

module.exports = lib.emojiModule;
