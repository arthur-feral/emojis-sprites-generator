import {
  configure,
  Config,
} from './config';

describe('Config', () => {
  it('should throw without commander parameters', () => {
    expect(() => {
      configure();
    }).to.throw('[config] You must provide a commander configuration');
  });

  it('should throw without preproc parameters', () => {
    expect(() => {
      configure({});
    }).to.throw('[config] You must provide a correct preprocessor parameter');
  });

  it('returns default config if no custom param given', () => {
    expect(configure({
      preproc: 'sass',
    })).to.deep.equal({
      destination: 'emojis',
      size: 48,
      cache: false,
      prefix: 'emojis',
      preproc: 'sass',
    });
  });

  it('should use custom config', () => {
    expect(configure({
      size: '64',
      cache: true,
      prefix: 'prefix',
      preproc: 'less',
    })).to.deep.equal(new Config({
      destination: 'emojis',
      size: 64,
      cache: true,
      prefix: 'prefix',
      preproc: 'less',
    }));
  });
});