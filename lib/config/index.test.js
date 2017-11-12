import {
  configure,
  Config,
} from './index';

describe('Config', () => {
  it('should throw without commander parameters', () => {
    expect(() => {
      configure();
    }).to.throw('[config] You must provide a commander configuration');
  });

  it('returns default config if no custom param given', () => {
    expect(configure({})).to.deep.equal({
      destination: [process.cwd(), 'emojis'].join('/'),
      size: 24,
      fromCache: false,
      prefix: 'emojis',
      preproc: 'sass',
    });
  });

  it('should use custom config', () => {
    expect(configure({
      size: 64,
      fromCache: true,
      prefix: 'prefix',
      preproc: 'less',
    })).to.deep.equal(new Config({
      destination: [process.cwd(), 'emojis'].join('/'),
      size: 64,
      fromCache: true,
      prefix: 'prefix',
      preproc: 'less',
    }));

    expect(configure({
      size: '64',
      fromCache: true,
      prefix: 'prefix',
      preproc: 'less',
    })).to.deep.equal(new Config({
      destination: [process.cwd(), 'emojis'].join('/'),
      size: 64,
      fromCache: true,
      prefix: 'prefix',
      preproc: 'less',
    }));
  });
});