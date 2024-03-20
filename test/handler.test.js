const test = require('tape');
const Sinon = require('sinon');
const createHandler = require('../handler');
const fakeHit = require('./helpers/fake-hit');
const noop = () => null;

test('Should generate and upload sitemap.xml', (t) => {
  t.plan(4);

  // Elastic index will have 3 documents in it
  // Page size is 1
  // Max URLs per sitemap is 2
  const testSettings = {
    siteUrl: 'http://localhost',
    sitemapUrl: 'http://localhost',
    pageSize: 1, // Page size 1 so scroll is called for the second & third page
    maxSitemapUrls: 2, // To split 3 documents between 2 sitemaps
    elasticsearch: {
      apiVersion: 5.4,
      node: 'http://localhost'
    },
    s3: {
      accessKeyId: 'TEST',
      secretAccessKey: 'TEST',
      bucket: 'TEST'
    }
  };

  const elastic = { search: noop, scroll: noop };
  const mockElastic = Sinon.mock(elastic);

  const result = () => ({body: {hits: {total: 3, hits: [fakeHit()]}}});
  const catResult = () => ({body: {aggregations: {category: {buckets: [{key: 'Surgery', doc_count: 1}]}}}});
  const locResult = () => ({body: {aggregations: {location: {buckets: [{key: 'Science Museum', doc_count: 5}]}}}});
  const locCatResult = () => ({body: {aggregations: {category: {category: {buckets: [{key: 'Robots', doc_count: 3}]}}}}});

  // First result on initial call
  mockElastic.expects('search')
    .exactly(1)
    .callsArgWithAsync(1, null, catResult());

  mockElastic.expects('search')
    .exactly(1)
    .callsArgWithAsync(1, null, locResult());

  mockElastic.expects('search')
    .exactly(4)
    .callsArgWithAsync(1, null, locCatResult());

  mockElastic.expects('search')
    .exactly(1)
    .callsArgWithAsync(1, null, result());

  // Second and third result on second and third call
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
    .exactly(4)  // Expecting 4 files ot upload: index, sitemap 1 and sitemap 2
    .onFirstCall().returns(emitter())
    .onSecondCall().returns(emitter())
    .onThirdCall().returns(emitter())
    .onCall(3).returns(emitter());

  const handler = createHandler(elastic, s3, testSettings);

  // Method under test
  handler(Sinon.stub(), Sinon.stub(), (err, sitemapUrls) => {
    t.ifError(err, 'Handler completed successfully');
    t.doesNotThrow(() => mockElastic.verify(), 'Elasticsearch mock verified');
    t.doesNotThrow(() => mockS3.verify(), 's3 mock verified');
    t.equal(sitemapUrls.length, 4, 'Correct number of sitemaps created');
    t.end();
  });
});
