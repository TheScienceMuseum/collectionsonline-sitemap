const test = require('tape');
const Sinon = require('sinon');
const hitToSitemapEntry = require('../lib/hit-to-sitemap-entry');

const noop = () => null;

const testSettings = {
  siteUrl: 'http://localhost',
  imageSiteUrl: 'https://images.example.com'
};

test('Should convert hit document to sitemap entry with slug', (t) => {
  t.plan(5);

  const id = 'smg-agent-12345';
  const type = 'agent';
  const processed = Date.now();

  const hit = {
    _id: id,
    _source: {
      '@admin': {uid: id, processed: processed},
      '@datatype': {base: type},
      summary: {title: 'Charles Babbage'}
    }
  };

  hitToSitemapEntry(hit, null, testSettings, (err, entry) => {
    t.ifError(err, 'No error');

    t.ok(entry.loc, 'Entry has location key');
    t.equal(entry.loc, `${testSettings.siteUrl}/people/smg-people-12345/charles-babbage`, 'Entry has expected location value');

    t.ok(entry.lastmod, 'Entry has last processed key');
    t.equal(entry.lastmod, new Date(processed).toISOString(), 'Entry has expected last processed value');

    t.end();
  });
});

test('Should convert hit document to sitemap entry without slug', (t) => {
  t.plan(3);

  const id = 'smg-agent-12346';
  const type = 'agent';
  const processed = Date.now();

  const hit = {
    _id: id,
    _source: {
      '@admin': {uid: id, processed: processed},
      '@datatype': {base: type},
      summary: {title: 'Secret Agent'}
    }
  };

  hitToSitemapEntry(hit, null, testSettings, (err, entry) => {
    t.ifError(err, 'No error');
    t.ok(entry.loc, 'Entry has location key');
    t.equal(entry.loc, `${testSettings.siteUrl}/people/smg-people-12346/secret-agent`, 'Entry has expected location value');
    t.end();
  });
});

test('Should include image:image entries from multimedia', (t) => {
  t.plan(5);

  const hit = {
    _id: 'smg-object-99',
    _source: {
      '@admin': {uid: 'co99', processed: Date.now()},
      '@datatype': {base: 'object'},
      summary: {title: 'Test Object'},
      multimedia: [
        {
          '@processed': {large: {location: '1/2/large_img1.jpg'}},
          '@type': 'image'
        },
        {
          '@type': 'image'
          // no @processed — should be ignored
        }
      ]
    }
  };

  hitToSitemapEntry(hit, null, testSettings, (err, entry) => {
    t.ifError(err, 'No error');
    t.ok(entry['image:image'], 'Entry has image:image');
    t.equal(entry['image:image'].length, 1, 'Only one image (with @processed.large)');
    t.equal(entry['image:image'][0]['image:loc'], `${testSettings.imageSiteUrl}/1/2/large_img1.jpg`, 'Image loc is correct');
    t.equal(entry['image:image'][0]['image:title'], 'Test Object', 'image:title matches record title');
    t.end();
  });
});

test('Should merge and deduplicate parent and child images', (t) => {
  t.plan(5);

  var parentImageLoc = '10/20/large_parent.jpg';
  var childImageLoc = '10/30/large_child.jpg';

  const hit = {
    _id: 'smg-object-parent',
    _source: {
      '@admin': {uid: 'co-parent', processed: Date.now()},
      '@datatype': {base: 'object'},
      summary: {title: 'Parent Object'},
      child: [{_id: 'smg-object-child'}],
      multimedia: [
        {'@processed': {large: {location: parentImageLoc}}, '@type': 'image'}
      ]
    }
  };

  const childSearchResult = {
    body: {
      hits: {
        hits: [{
          _source: {
            multimedia: [
              {'@processed': {large: {location: childImageLoc}}, '@type': 'image'},
              {'@processed': {large: {location: parentImageLoc}}, '@type': 'image'} // duplicate — should be skipped
            ]
          }
        }]
      }
    }
  };

  const elastic = {search: noop};
  const mockElastic = Sinon.mock(elastic);
  mockElastic.expects('search').once().callsArgWithAsync(1, null, childSearchResult);

  hitToSitemapEntry(hit, elastic, testSettings, (err, entry) => {
    t.ifError(err, 'No error');
    t.doesNotThrow(() => mockElastic.verify(), 'Elasticsearch mock verified');
    t.ok(entry['image:image'], 'Entry has image:image');
    t.equal(entry['image:image'].length, 2, 'Two unique images (parent + child, duplicate removed)');
    t.ok(entry['image:image'].find(i => i['image:loc'] === `${testSettings.imageSiteUrl}/${childImageLoc}`), 'Child image is present');
    t.end();
  });
});

test('Should apply minLastmod floor when record is older', (t) => {
  t.plan(3);

  const oldProcessed = new Date('2020-01-01').getTime();
  const minLastmod = '2024-06-01T00:00:00.000Z';

  const hit = {
    _id: 'smg-object-old',
    _source: {
      '@admin': {uid: 'co-old', processed: oldProcessed},
      '@datatype': {base: 'object'},
      summary: {title: 'Old Record'}
    }
  };

  hitToSitemapEntry(hit, null, Object.assign({}, testSettings, {minLastmod}), (err, entry) => {
    t.ifError(err, 'No error');
    t.equal(entry.lastmod, minLastmod, 'lastmod is floored to minLastmod');
    t.notEqual(entry.lastmod, new Date(oldProcessed).toISOString(), 'lastmod is not the original processed date');
    t.end();
  });
});

test('Should not apply minLastmod floor when record is newer', (t) => {
  t.plan(2);

  const recentProcessed = new Date('2025-01-01').getTime();
  const minLastmod = '2024-06-01T00:00:00.000Z';

  const hit = {
    _id: 'smg-object-new',
    _source: {
      '@admin': {uid: 'co-new', processed: recentProcessed},
      '@datatype': {base: 'object'},
      summary: {title: 'New Record'}
    }
  };

  hitToSitemapEntry(hit, null, Object.assign({}, testSettings, {minLastmod}), (err, entry) => {
    t.ifError(err, 'No error');
    t.equal(entry.lastmod, new Date(recentProcessed).toISOString(), 'lastmod uses record date when newer than minLastmod');
    t.end();
  });
});

test('Should not include image:image key when no images', (t) => {
  t.plan(2);

  const hit = {
    _id: 'smg-object-noimg',
    _source: {
      '@admin': {uid: 'co-noimg', processed: Date.now()},
      '@datatype': {base: 'object'},
      summary: {title: 'No Images'}
    }
  };

  hitToSitemapEntry(hit, null, testSettings, (err, entry) => {
    t.ifError(err, 'No error');
    t.notOk(entry['image:image'], 'image:image key is absent when no images');
    t.end();
  });
});
