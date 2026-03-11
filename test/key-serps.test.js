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
    museums: ['Science Museum', 'Locomotion'],
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
  // Locomotion only appears as a combined 'Locomotion, Main Hall' entry — there
  // is no standalone 'Locomotion' bucket. The standaloneMuseums setting ensures
  // a top-level museum URL is still generated.
  const locResult = () => ({
    body: {
      aggregations: {
        display_values: {
          buckets: [
            { key: 'Science Museum', doc_count: 12556 },
            { key: 'Science Museum, Energy Hall', doc_count: 2335 },
            { key: 'Science Museum, Clockmakers\' Museum Gallery', doc_count: 150 }, // apostrophe in gallery name
            { key: 'Energy Hall', doc_count: 2335 }, // standalone gallery — should be skipped
            { key: 'Locomotion, Main Hall', doc_count: 500 }, // Locomotion appears as combined entry
            { key: 'Science and Innovation Park, Welcome Building', doc_count: 4 } // not in museums allowlist — should be skipped
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
              key: 'Science Museum, Clockmakers\' Museum Gallery',
              doc_count: 150,
              categories: { buckets: [{ key: 'Horology', doc_count: 150 }] }
            },
            {
              key: 'Energy Hall', // standalone gallery — should be skipped
              doc_count: 2335,
              categories: { buckets: [{ key: 'Robots', doc_count: 2 }] }
            },
            {
              key: 'Locomotion, Main Hall', // Locomotion appears as combined entry
              doc_count: 500,
              categories: { buckets: [{ key: 'Robots', doc_count: 1 }] }
            },
            {
              key: 'Science and Innovation Park, Welcome Building', // not in museums allowlist
              doc_count: 4,
              categories: { buckets: [{ key: 'Robots', doc_count: 1 }] }
            }
          ]
        }
      }
    }
  });

  // get-collections.js: cumulation.collector.summary.title.keyword aggregation
  const colResult = () => ({
    body: {
      aggregations: {
        collection: { buckets: [{ key: 'Flight Collection', doc_count: 42 }] }
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

  mockElastic.expects('search')
    .exactly(1)
    .callsArgWithAsync(1, null, colResult());

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
    t.ok(data.find(el => el.loc === 'http://localhost/search/museum/locomotion'), 'Locomotion gets a top-level museum URL even with no standalone bucket');
    t.ok(data.find(el => el.loc === 'http://localhost/search/museum/locomotion/gallery/main-hall'), 'Locomotion gets a museum+gallery URL');
    t.ok(data.find(el => el.loc === 'http://localhost/search/categories/robots/museum/locomotion'), 'Locomotion gets a category+museum URL derived from its gallery entries');
    t.ok(data.find(el => el.loc === 'http://localhost/search/categories/robots/museum/locomotion/gallery/main-hall'), 'Locomotion gets a category+museum+gallery URL');
    t.notOk(data.find(el => el.loc.includes('science-and-innovation-park')), 'Non-allowlisted location is excluded entirely');
    t.ok(data.find(el => el.loc === 'http://localhost/search/collection/flight-collection'), 'Collection URL is correct');
    t.ok(data.find(el => el.loc === "http://localhost/search/museum/science-museum/gallery/clockmakers'-museum-gallery"), "Apostrophe in gallery name is preserved in URL");
    t.ok(data.find(el => el.loc === "http://localhost/search/categories/horology/museum/science-museum/gallery/clockmakers'-museum-gallery"), "Apostrophe preserved in category+museum+gallery URL");

    t.end();
  });
});
