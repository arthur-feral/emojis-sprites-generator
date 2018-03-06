import {
  each,
  includes,
} from 'lodash';
import logger from '../logger';

/**
 * @typedef Config
 * @property {String} destination
 * @property {String|Integer} size
 * @property {Boolean} cache
 * @property {String} prefix
 * @property {String} preproc
 */
/**
 * @param {String} destination
 * @param {String|Integer} size
 * @param {Boolean} cache
 * @param {String} prefix
 * @param {String} preproc
 * @constructor
 */
export const Config = ({
  destination,
  size,
  cache,
  prefix,
  preproc,
}) => ({
  destination,
  size: parseInt(size, 10),
  cache,
  prefix,
  preproc,
});

/**
 * default config provided to module
 * @name DEFAULT_CONFIG
 * @type {Object}
 */
const DEFAULT_CONFIG = {
  destination: 'emojis',
  size: 48,
  cache: false,
  prefix: 'emojis',
  preproc: 'sass',
};

const PREPROCS = ['sass', 'less'];

/**
 * parse cli args and build config to provide to the module
 * @name configure
 * @param {Object} commander
 * @returns {Config}
 */
export const configure = (commander) => {
  let config = {};

  if (!commander || !process.argv) {
    throw new Error('[config] You must provide a commander configuration');
  }

  if (!includes(PREPROCS, commander.preproc)) {
    throw new Error('[config] You must provide a correct preprocessor parameter');
  }

  each(DEFAULT_CONFIG, (defaultValue, parameter) => {
    config[parameter] = commander[parameter] ?
      commander[parameter] :
      defaultValue;
    logger.info(`${parameter}: ${config[parameter]}`);
  });

  return new Config(config);
};
