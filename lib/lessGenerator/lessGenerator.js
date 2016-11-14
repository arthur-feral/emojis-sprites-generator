'use strict';

const _ = require('lodash');
const fs = require('fs');
const gm = require('gm');
const when = require('when');
const sizeOf = require('image-size');

const lessFileTemplate = fs.readFileSync(`${__dirname}/lessFile`, 'utf8');
const emojiTemplate = fs.readFileSync(`${__dirname}/emoji`, 'utf8');

let lessGenerator = (pathToSprite, emojisList) => {
  const spriteDimensions = sizeOf(pathToSprite);
  let lessFile = lessFileTemplate
    .replace('<%pathToSprite%>', pathToSprite)
    .replace('<%spriteWidth%>', spriteDimensions.width)
    .replace('<%spriteHeight%>', spriteDimensions.height);

};

module.exports = lessGenerator;
