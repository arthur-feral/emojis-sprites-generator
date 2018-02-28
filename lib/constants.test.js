import * as constants from './constants';

describe('Constants', () => {
  it('should contains these vars', () => {
    expect(constants.BASE_URL).to.equal('https://emojipedia.org');
    expect(constants.APP_START).to.equal('APP_START');
    expect(constants.FILES_DONE).to.equal('FILES_DONE');
    expect(constants.ERROR).to.equal('ERROR');
    expect(constants.COLLECTOR_COLLECT_DONE).to.equal('COLLECTOR_COLLECT_DONE');
    expect(constants.FETCHER_FETCH_CATEGORIES_ERROR).to.equal('FETCHER_FETCH_CATEGORIES_ERROR');
    expect(constants.FETCHER_FETCH_CATEGORIES_SUCCESS).to.equal('FETCHER_FETCH_CATEGORIES_SUCCESS');
    expect(constants.FETCHER_FETCH_CATEGORY_ERROR).to.equal('FETCHER_FETCH_CATEGORY_ERROR');
    expect(constants.FETCHER_FETCH_CATEGORY_SUCCESS).to.equal('FETCHER_FETCH_CATEGORY_SUCCESS');
    expect(constants.FETCHER_FETCH_EMOJI_ERROR).to.equal('FETCHER_FETCH_EMOJI_ERROR');
    expect(constants.FETCHER_FETCH_EMOJI_SUCCESS).to.equal('FETCHER_FETCH_EMOJI_SUCCESS');
    expect(constants.FETCHER_FETCH_IMAGE_ERROR).to.equal('FETCHER_FETCH_IMAGE_ERROR');
    expect(constants.FETCHER_FETCH_IMAGE_SUCCESS).to.equal('FETCHER_FETCH_IMAGE_SUCCESS');
    expect(constants.PARSER_PARSE_CATEGORIES_ERROR).to.equal('PARSER_PARSE_CATEGORIES_ERROR');
    expect(constants.PARSER_PARSE_CATEGORIES_SUCCESS).to.equal('PARSER_PARSE_CATEGORIES_SUCCESS');
    expect(constants.PARSER_PARSE_CATEGORY_SUCCESS).to.equal('PARSER_PARSE_CATEGORY_SUCCESS');
    expect(constants.PARSER_PARSE_EMOJI_ERROR).to.equal('PARSER_PARSE_EMOJI_ERROR');
    expect(constants.PARSER_PARSE_EMOJI_SUCCESS).to.equal('PARSER_PARSE_EMOJI_SUCCESS');
    expect(constants.PARSER_PARSE_IMAGE_SUCCESS).to.equal('PARSER_PARSE_IMAGE_SUCCESS');
    expect(constants.PARSER_PARSED_ALL_IMAGES).to.equal('PARSER_PARSED_ALL_IMAGES');
    expect(constants.PARSER_PARSE_IMAGE_ERROR).to.equal('PARSER_PARSE_IMAGE_ERROR');
    expect(constants.PARSER_FOUND_MODIFIERS).to.equal('PARSER_FOUND_MODIFIERS');
    expect(constants.PARSER_IMAGES_FOUND).to.equal('PARSER_IMAGES_FOUND');
    expect(constants.HTML_CATEGORIES_SELECTOR).to.equal('body div.container div.sidebar div.block:first-child');
    expect(constants.HTML_EMOJIS_SELECTOR).to.equal('body div.container div.content ul.emoji-list');
    expect(constants.HTML_EMOJI_SHORTNAMES).to.equal('body div.container div.content article ul.shortcodes li');
    expect(constants.HTML_EMOJI_MODIFIERS).to.equal('body div.container div.content article section.modifiers ul li');
    expect(constants.HTML_EMOJI_THEMES).to.equal('body div.container div.content article section.vendor-list ul li .vendor-rollout-target');
  });
});
