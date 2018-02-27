/**
 * @constant BASE_URL
 * @type {string}
 */
export const BASE_URL = 'https://emojipedia.org';

export const APP_START = 'APP_START';

/**
 * @constant
 * @type {string}
 */
export const FETCHER_FETCH_CATEGORIES_ERROR = 'FETCHER_FETCH_CATEGORIES_ERROR';
/**
 * @constant
 * @type {string}
 */
export const FETCHER_FETCH_CATEGORIES_SUCCESS = 'FETCHER_FETCH_CATEGORIES_SUCCESS';
/**
 * @constant
 * @type {string}
 */
export const FETCHER_FETCH_CATEGORY_ERROR = 'FETCHER_FETCH_CATEGORY_ERROR';
/**
 * @constant
 * @type {string}
 */
export const FETCHER_FETCH_CATEGORY_SUCCESS = 'FETCHER_FETCH_CATEGORY_SUCCESS';
/**
 * @constant
 * @type {string}
 */
export const FETCHER_FETCH_EMOJI_ERROR = 'FETCHER_FETCH_EMOJI_ERROR';
/**
 * @constant
 * @type {string}
 */
export const FETCHER_FETCH_EMOJI_SUCCESS = 'FETCHER_FETCH_EMOJI_SUCCESS';
/**
 * @constant
 * @type {string}
 */
export const FETCHER_FETCH_IMAGE_ERROR = 'FETCHER_FETCH_IMAGE_ERROR';
/**
 * @constant
 * @type {string}
 */
export const FETCHER_FETCH_IMAGE_SUCCESS = 'FETCHER_FETCH_IMAGE_SUCCESS';

/**
 * @constant
 * @type {string}
 */
export const PARSER_PARSE_CATEGORIES_ERROR = 'PARSER_PARSE_CATEGORIES_ERROR';
/**
 * @constant
 * @type {string}
 */
export const PARSER_PARSE_CATEGORIES_SUCCESS = 'PARSER_PARSE_CATEGORIES_SUCCESS';
/**
 * @constant
 * @type {string}
 */
export const PARSER_PARSE_CATEGORY_ERROR = 'PARSER_PARSE_CATEGORY_ERROR';
/**
 * @constant
 * @type {string}
 */
export const PARSER_PARSE_CATEGORY_SUCCESS = 'PARSER_PARSE_CATEGORY_SUCCESS';
/**
 * @constant
 * @type {string}
 */
export const PARSER_PARSE_EMOJI_ERROR = 'PARSER_PARSE_EMOJI_ERROR';
/**
 * @constant
 * @type {string}
 */
export const PARSER_PARSE_EMOJI_SUCCESS = 'PARSER_PARSE_EMOJI_SUCCESS';
/**
 * @constant
 * @type {string}
 */
export const PARSER_PARSE_IMAGE_ERROR = 'PARSER_PARSE_IMAGE_ERROR';
/**
 * @constant
 * @type {string}
 */
export const PARSER_PARSE_IMAGE_SUCCESS = 'PARSER_PARSE_IMAGE_SUCCESS';

export const PARSER_FOUND_MODIFIERS = 'PARSER_FOUND_MODIFIERS';

export const HTML_CATEGORIES_SELECTOR = 'body div.container div.sidebar div.block:first-child';
export const HTML_EMOJIS_SELECTOR = 'body div.container div.content ul.emoji-list';
export const HTML_EMOJI_SHORTNAMES = 'body div.container div.content article ul.shortcodes li';
export const HTML_EMOJI_MODIFIERS = 'body div.container div.content article section.modifiers ul li';
export const HTML_EMOJI_THEMES = 'body div.container div.content article section.vendor-list ul li .vendor-rollout-target';