const test = require('tape');
const hitToSitemapEntry = require('../lib/hit-to-sitemap-entry');

test('Should convert hit document to sitemap entry with slug', (t) => {
  t.plan(6);

  const id = 'smg-agent-12345';
  const type = 'agent';
  const processed = Date.now();

  const hit = {
    _id: id,
    _type: type,
    _source: {
      '@admin': {
        processed: processed
      },
      summary_title: 'Charles Babbage'
    }
  };

  const url = 'http://localhost';

  const entry = hitToSitemapEntry(hit, url);

  t.ok(entry.loc, 'Entry has location key');
  t.equal(entry.loc, `${url}/people/smg-people-12345/charles-babbage`, 'Entry has expected location value');

  t.ok(entry.lastmod, 'Entry has last processed key');
  t.equal(entry.lastmod, new Date(processed).toISOString(), 'Entry has expected last processed value');

  t.ok(entry.changefreq, 'Entry has change frequency key');
  t.equal(entry.changefreq, 'daily', 'Entry has expected change frequency value');

  t.end();
});

test('Should convert hit document to sitemap entry without slug', (t) => {
  t.plan(2);

  const id = 'smg-agent-12346';
  const type = 'agent';
  const processed = Date.now();

  const hit = {
    _id: id,
    _type: type,
    _source: {
      '@admin': {
        processed: processed
      }
    }
  };

  const url = 'http://localhost';

  const entry = hitToSitemapEntry(hit, url);

  t.ok(entry.loc, 'Entry has location key');
  t.equal(entry.loc, `${url}/people/smg-people-12346`, 'Entry has expected location value');

  t.end();
});
