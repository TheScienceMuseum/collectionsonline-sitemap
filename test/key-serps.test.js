const test = require('tape');
const Sinon = require('sinon');
const noop = () => null;
const addKeySerps = require('../lib/add-key-serps.js');

test('Should get key serp pages', (t) => {
  const testSettings = {
    siteUrl: 'http://localhost',
    sitemapUrl: 'http://localhost',
    pageSize: 1,
    maxSitemapUrls: 2,
    elasticsearch: {
      apiVersion: 5.4,
      host: 'http://localhost'
    },
    s3: {
      accessKeyId: 'TEST',
      secretAccessKey: 'TEST',
      bucket: 'TEST'
    }
  };

  const elastic = { search: noop };
  const mockElastic = Sinon.mock(elastic);

  const catResult = () => ({body: {aggregations: {category: {buckets: [{key: 'Surgery', doc_count: 1}]}}}});
  const locResult = () => ({body: {aggregations: {location: {buckets: [{key: 'Science Museum', doc_count: 5}]}}}});
  const locCatResult = () => ({body: {aggregations: {category: {category: {buckets: [{key: 'Robots', doc_count: 3}]}}}}});

  mockElastic.expects('search')
    .exactly(1)
    .callsArgWithAsync(1, null, catResult());

  mockElastic.expects('search')
    .exactly(1)
    .callsArgWithAsync(1, null, locResult());

  mockElastic.expects('search')
    .exactly(4)
    .callsArgWithAsync(1, null, locCatResult());

  addKeySerps(elastic, testSettings, [], (err, data) => {
    t.ifError(err, 'Results added successfully');
    t.doesNotThrow(() => mockElastic.verify(), 'Elasticsearch mock verified');
    t.ok(data.every(el => el.loc === el.loc.toLowerCase()), 'URLs are all lowercase');
    t.ok(data.find(el => el.loc === 'http://localhost/search/categories/surgery'), 'URLs are created correctly');
    t.ok(data.find(el => el.loc === 'http://localhost/search/museum/science-museum/categories/robots'), 'URLs are created correctly');
    t.ok(data.find(el => el.loc === 'http://localhost/search/museum/science-museum'), 'URLs are created correctly');
    t.end();
  });
});
