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

  it('returns default config if no custom param given', () => {
    expect(configure({ args: {} })).to.deep.equal({
      destination: [process.cwd(), 'emojis'].join('/'),
      size: 48,
      fromCache: false,
      prefix: 'emojis',
      preproc: 'sass',
    });
  });

  it('should use custom config', () => {
    expect(configure({
      args: {
        size: '64',
        fromCache: true,
        prefix: 'prefix',
        preproc: 'less',
      },
    })).to.deep.equal(new Config({
      destination: [process.cwd(), 'emojis'].join('/'),
      size: 64,
      fromCache: true,
      prefix: 'prefix',
      preproc: 'less',
    }));
  });
});