'use strict';

const lessGenerator = require('./lessGenerator');
const sassGenerator = require('./sassGenerator');

/**
 * generate the stylesheet preprocessor file
 * @param theme
 * @param preproc
 * @param prefix
 * @param emojis
 * @param dimensions
 * @param destination
 * @return {Promise}
 */
const generate = (theme, preproc, prefix, emojis, dimensions, destination) => {
  if (preproc === 'less') {
    return lessGenerator.generate(theme, prefix, emojis, dimensions, destination);
  }

  if (preproc === 'sass') {
    return sassGenerator.generate(theme, prefix, emojis, dimensions, destination);
  }

  throw new Error('[stylesheetGenerator] unknown preprocessor type');
};

module.exports = {
  generate
};
