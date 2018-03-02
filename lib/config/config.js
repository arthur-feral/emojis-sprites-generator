import {
  each,
} from 'lodash';
import logger from '../logger';

/**
 * @typedef Config
 * @property {String} destination
 * @property {String|Integer} size
 * @property {Boolean} fromCache
 * @property {String} prefix
 * @property {String} preproc
 */
/**
 * @param {String} destination
 * @param {String|Integer} size
 * @param {Boolean} fromCache
 * @param {String} prefix
 * @param {String} preproc
 * @constructor
 */
export const Config = ({
  destination,
  size,
  fromCache,
  prefix,
  preproc,
}) => ({
  destination,
  size: parseInt(size, 10),
  fromCache,
  prefix,
  preproc,
});

/**
 * default config provided to module
 * @name DEFAULT_CONFIG
 * @type {Object}
 */
const DEFAULT_CONFIG = {
  destination: [process.cwd(), 'emojis'].join('/'),
  size: 48,
  fromCache: true,
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

  if (!commander || !commander.args) {
    throw new Error('[config] You must provide a commander configuration');
  }

  each(DEFAULT_CONFIG, (defaultValue, parameter) => {
    config[parameter] = commander.args[parameter] ?
      commander.args[parameter] :
      defaultValue;
    logger.info(`${parameter}: ${config[parameter]}`);
  });

  return new Config(config);
};