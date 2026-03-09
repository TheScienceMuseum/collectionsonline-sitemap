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

  // get-categories.js: category.name.keyword aggregation
  const catResult = () => ({
    body: {
      aggregations: {
        category: { buckets: [{ key: 'Surgery', doc_count: 1 }] }
      }
    }
  });

  // get-locations.js: ondisplay.value.keyword aggregation
  // includes a standalone museum and a combined 'Museum, Gallery' entry
  const locResult = () => ({
    body: {
      aggregations: {
        display_values: {
          buckets: [
            { key: 'Science Museum', doc_count: 12556 },
            { key: 'Science Museum, Energy Hall', doc_count: 2335 },
            { key: 'Energy Hall', doc_count: 2335 } // standalone gallery — should be skipped
          ]
        }
      }
    }
  });

  // get-categories-at-locations.js: ondisplay.value.keyword with categories sub-agg
  const locCatResult = () => ({
    body: {
      aggregations: {
        display_values: {
          buckets: [
            {
              key: 'Science Museum',
              doc_count: 12556,
              categories: { buckets: [{ key: 'Robots', doc_count: 3 }] }
            },
            {
              key: 'Science Museum, Energy Hall',
              doc_count: 2335,
              categories: { buckets: [{ key: 'Robots', doc_count: 2 }] }
            },
            {
              key: 'Energy Hall', // standalone gallery — should be skipped
              doc_count: 2335,
              categories: { buckets: [{ key: 'Robots', doc_count: 2 }] }
            }
          ]
        }
      }
    }
  });

  mockElastic.expects('search')
    .exactly(1)
    .callsArgWithAsync(1, null, catResult());

  mockElastic.expects('search')
    .exactly(1)
    .callsArgWithAsync(1, null, locResult());

  mockElastic.expects('search')
    .exactly(1)
    .callsArgWithAsync(1, null, locCatResult());

  addKeySerps(elastic, testSettings, [], (err, data) => {
    t.ifError(err, 'Results added successfully');
    t.doesNotThrow(() => mockElastic.verify(), 'Elasticsearch mock verified');
    t.ok(data.every(el => el.loc === el.loc.toLowerCase()), 'URLs are all lowercase');

    t.ok(data.find(el => el.loc === 'http://localhost/search/categories/surgery'), 'Category URL is correct');
    t.ok(data.find(el => el.loc === 'http://localhost/search/museum/science-museum'), 'Museum URL is correct');
    t.ok(data.find(el => el.loc === 'http://localhost/search/museum/science-museum/gallery/energy-hall'), 'Museum+gallery URL is correct');
    t.ok(data.find(el => el.loc === 'http://localhost/search/categories/robots/museum/science-museum'), 'Category+museum URL is correct');
    t.ok(data.find(el => el.loc === 'http://localhost/search/categories/robots/museum/science-museum/gallery/energy-hall'), 'Category+museum+gallery URL is correct');
    t.notOk(data.find(el => el.loc === 'http://localhost/search/museum/energy-hall'), 'Standalone gallery is not a top-level museum URL');

    t.end();
  });
});
