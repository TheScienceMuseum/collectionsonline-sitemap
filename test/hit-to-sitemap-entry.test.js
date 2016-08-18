const test = require('tape');
const hitToSitemapEntry = require('../lib/hit-to-sitemap-entry');

test('Should convert hit document to sitemap entry', (t) => {
  t.plan(6);

  const id = 'smg-agent-12345';
  const type = 'agent';
  const modified = Date.now();

  const hit = {
    _id: id,
    _type: type,
    _source: {
      admin: {
        modified: modified
      }
    }
  };

  const url = 'http://localhost';

  const entry = hitToSitemapEntry(hit, url);

  t.ok(entry.loc, 'Entry has location key');
  t.equal(entry.loc, `${url}/people/smg-people-12345`, 'Entry has expected location value');

  t.ok(entry.lastmod, 'Entry has last modified key');
  t.equal(entry.lastmod, new Date(modified).toISOString(), 'Entry has expected last modified value');

  t.ok(entry.changefreq, 'Entry has change frequency key');
  t.equal(entry.changefreq, 'daily', 'Entry has expected change frequency value');

  t.end();
});
