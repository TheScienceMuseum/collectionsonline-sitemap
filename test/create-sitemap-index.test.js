const Fs = require('fs');
const Path = require('path');
const test = require('tape');
const mkdirp = require('mkdirp');
const parseString = require('xml2js').parseString;
const Faker = require('faker');
const createSitemapIndex = require('../lib/create-sitemap-index');

test('Should create an xml sitemap index', (t) => {
  t.plan(8);

  const sitemapUrl = Faker.internet.url();
  const sitemapFilenames = [Faker.system.fileName(), Faker.system.fileName()];
  var filePath = Path.resolve(__dirname, '..', 'tmp');
  mkdirp.sync(filePath);
  filePath = Path.join(filePath, `sitemap-${Date.now()}.xml`);

  createSitemapIndex(sitemapFilenames, sitemapUrl, filePath, (err) => {
    t.ifError(err, 'No error creating sitemap index');

    const xml = Fs.readFileSync(filePath, 'utf-8');

    parseString(xml, (err, obj) => {
      t.ifError(err, 'No error parsing sitemap index');

      t.ok(obj.sitemapindex, 'sitemapindex key was present');
      t.ok(obj.sitemapindex.sitemap, 'sitemapindex.sitemap key was present');

      t.ok(obj.sitemapindex.sitemap[0].loc[0], 'Sitemap has location key');
      t.equal(obj.sitemapindex.sitemap[0].loc[0], `${sitemapUrl}/${sitemapFilenames[0]}`, 'Sitemap has expected location value');

      t.ok(obj.sitemapindex.sitemap[1].loc[0], 'Sitemap has location key');
      t.equal(obj.sitemapindex.sitemap[1].loc[0], `${sitemapUrl}/${sitemapFilenames[1]}`, 'Sitemap has expected location value');

      t.end();
    });
  });
});
