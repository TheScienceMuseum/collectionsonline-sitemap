const Fs = require('fs');
const Path = require('path');
const test = require('tape');
const mkdirp = require('mkdirp');
const parseString = require('xml2js').parseString;
const createSitemap = require('../lib/create-sitemap');
const fakeSitemapEntry = require('./helpers/fake-sitemap-entry');

test('Should create an xml sitemap', (t) => {
  t.plan(16);

  const entries = [fakeSitemapEntry(), fakeSitemapEntry()];
  var filePath = Path.resolve(__dirname, '..', 'tmp');
  mkdirp.sync(filePath);
  filePath = Path.join(filePath, `sitemap-${Date.now()}.xml`);

  createSitemap(entries, filePath, (err) => {
    t.ifError(err, 'No error creating sitemap');

    const xml = Fs.readFileSync(filePath, 'utf-8');

    parseString(xml, (err, obj) => {
      t.ifError(err, 'No error parsing sitemap');

      t.ok(obj.urlset, 'urlset key was present');
      t.ok(obj.urlset.url, 'urlset.url key was present');

      t.ok(obj.urlset.url[0].loc[0], 'Entry has location key');
      t.equal(obj.urlset.url[0].loc[0], entries[0].loc, 'Entry has expected location value');

      t.ok(obj.urlset.url[0].lastmod[0], 'Entry has last modified key');
      t.equal(obj.urlset.url[0].lastmod[0], entries[0].lastmod, 'Entry has expected last modified value');

      t.ok(obj.urlset.url[0].changefreq[0], 'Entry has change frequency key');
      t.equal(obj.urlset.url[0].changefreq[0], entries[0].changefreq, 'Entry has expected change frequency value');

      t.ok(obj.urlset.url[1].loc[0], 'Entry has location key');
      t.equal(obj.urlset.url[1].loc[0], entries[1].loc, 'Entry has expected location value');

      t.ok(obj.urlset.url[1].lastmod[0], 'Entry has last modified key');
      t.equal(obj.urlset.url[1].lastmod[0], entries[1].lastmod, 'Entry has expected last modified value');

      t.ok(obj.urlset.url[1].changefreq[0], 'Entry has change frequency key');
      t.equal(obj.urlset.url[1].changefreq[0], entries[1].changefreq, 'Entry has expected change frequency value');

      t.end();
    });
  });
});
