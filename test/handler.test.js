const test = require('tape');
const Sinon = require('sinon');
const createHandler = require('../handler');
const fakeHit = require('./helpers/fake-hit');
const noop = () => null;

test('Should generate and upload sitemap.xml', (t) => {
  t.plan(4);

  const elastic = { search: noop, scroll: noop };
  const mockElastic = Sinon.mock(elastic);

  const result = () => ({ hits: { total: 3, hits: [fakeHit()] } });

  mockElastic.expects('search')
    .exactly(1)
    .callsArgWithAsync(1, null, result());

  mockElastic.expects('scroll')
    .exactly(2)
    .onFirstCall().callsArgWithAsync(1, null, result())
    .onSecondCall().callsArgWithAsync(1, null, result());

  const s3 = { uploadFile: noop };
  const mockS3 = Sinon.mock(s3);

  const emitter = () => ({
    on (name, fn) {
      if (name === 'end') setTimeout(fn, 100);
      return this;
    }
  });

  mockS3.expects('uploadFile')
    .exactly(2)  // 2 for index and sitemap
    .onFirstCall().returns(emitter())
    .onSecondCall().returns(emitter());

  const testSettings = {
    siteUrl: 'http://localhost',
    sitemapUrl: 'http://localhost',
    maxSitemapUrls: 50000,
    pageSize: 1, // Page size 1 so scroll is called for the second & third page
    elasticsearch: {
      apiVersion: 2.3,
      host: 'http://localhost'
    },
    s3: {
      accessKeyId: 'TEST',
      secretAccessKey: 'TEST',
      bucket: 'TEST'
    }
  };

  const handler = createHandler(elastic, s3, testSettings);

  // Method under test
  handler(Sinon.stub(), Sinon.stub(), (err, sitemapUrls) => {
    t.ifError(err, 'Handler completed successfully');
    t.doesNotThrow(() => mockElastic.verify(), 'Elasticsearch mock verified');
    t.doesNotThrow(() => mockS3.verify(), 's3 mock verified');
    t.equal(sitemapUrls.length, 2, 'Correct number of sitemaps created');
    t.end();
  });
});
