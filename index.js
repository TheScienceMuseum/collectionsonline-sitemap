const Path = require('path');
const mkdirp = require('mkdirp');
const Client = require('elasticsearch').Client;
const Async = require('async');
const scrollIndex = require('./lib/scroll-index');
const hitToSitemapEntry = require('./lib/hit-to-sitemap-entry');
const createSitemap = require('./lib/create-sitemap');
const createSitemapIndex = require('./lib/create-sitemap-index');
const settings = require('./settings.json');

const SITEMAPS_PATH = Path.join(__dirname, 'tmp');

exports.handler = (event, context) => {
  Async.waterfall([

    // Create tmp dir for storing the created sitemaps
    (cb) => mkdirp(SITEMAPS_PATH, (err) => cb(err)),

    // Create each sitemap
    (cb) => {
      const elastic = new Client(settings.elasticsearch);
      const sitemaps = [];

      scrollIndex(elastic, {
        batchSize: settings.maxSitemapUrls,
        fields: ['admin.modified'],

        // Transform a hit into a sitemap entry
        onHit: (hit) => hitToSitemapEntry(hit, settings.siteUrl),

        // Transform a batch of sitemap entries into a sitemap.xml
        onBatch: (entries, cb) => {
          const filename = `sitemap-${sitemaps.length}.xml`;
          const filePath = Path.join(SITEMAPS_PATH, filename);

          createSitemap(entries, filePath, (err) => {
            if (err) return cb(err);
            console.log(`${filename} created`);
            sitemaps.push(filename);
            cb();
          });
        }
      }, (err) => cb(err, sitemaps));
    },

    // Create sitemap index file
    (sitemaps, cb) => {
      const filePath = Path.join(SITEMAPS_PATH, 'sitemap.xml');
      createSitemapIndex(sitemaps, settings.sitemapUrl, filePath, cb);
    }

  ], (err) => {
    if (err) throw err;
    console.log('sitemap.xml created');
  });
};
