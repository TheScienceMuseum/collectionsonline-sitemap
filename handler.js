const Path = require('path');
const mkdirp = require('mkdirp');
const Async = require('async');
const scrollIndex = require('./lib/scroll-index');
const hitToSitemapEntry = require('./lib/hit-to-sitemap-entry');
const createSitemap = require('./lib/create-sitemap');
const createSitemapIndex = require('./lib/create-sitemap-index');
const uploadFiles = require('./lib/upload-files');
const addKeySerps = require('./lib/add-key-serps');

module.exports = (elastic, s3, settings) => {
  // SITEMAP_MIN_LASTMOD env var overrides settings — set in Lambda to force
  // Google to recrawl all pages e.g. after a design change. Remove once done.
  if (process.env.SITEMAP_MIN_LASTMOD) {
    settings = Object.assign({}, settings, { minLastmod: process.env.SITEMAP_MIN_LASTMOD });
  }

  // SITEMAP_MIN_LASTMOD_EXCLUDE — comma-separated list of types to exempt from
  // the minLastmod floor (e.g. "documents"). Useful when some record types are
  // expensive to reprocess and can be deferred to a later recrawl.
  if (process.env.SITEMAP_MIN_LASTMOD_EXCLUDE) {
    settings = Object.assign({}, settings, {
      minLastmodExclude: process.env.SITEMAP_MIN_LASTMOD_EXCLUDE.split(',').map(function (t) { return t.trim(); })
    });
  }

  const sitemapDir = Path.join(settings.tmpDir || 'tmp', 'sitemap' + Date.now().toString());

  return (event, context, cb) => {
    Async.waterfall([

      // Create tmp dir for storing the created sitemaps
      (cb) => mkdirp(sitemapDir, (err) => cb(err)),

      // Add key SERP pages to sitemap
      (cb) => {
        const sitemaps = [];

        addKeySerps(elastic, settings, sitemaps, cb);
      },

      (sitemaps, cb) => {
        const filename = `sitemap-${0}.xml`;
        const filePath = Path.join(sitemapDir, filename);

        createSitemap(sitemaps, filePath, (err) => {
          if (err) return cb(err);
          console.log(`${filename} created`);
          cb(null, [filename]);
        });
      },

      // Create each sitemap
      (sitemaps, cb) => {
        scrollIndex(elastic, {
          batchSize: settings.maxSitemapUrls,
          pageSize: settings.pageSize,
          fields: ['@admin.uid', '@admin.processed', '@datatype.base', 'summary.title', 'multimedia', 'child'],

          // Transform a hit into a sitemap entry
          onHit: (hit, cb) => hitToSitemapEntry(hit, elastic, settings, cb),

          // Transform a batch of sitemap entries into a sitemap.xml
          onBatch: (entries, cb) => {
            const filename = `sitemap-${sitemaps.length}.xml`;
            const filePath = Path.join(sitemapDir, filename);

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
        const filePath = Path.join(sitemapDir, 'sitemap.xml');

        createSitemapIndex(sitemaps, settings.sitemapUrl, filePath, (err) => {
          if (err) return cb(err);
          cb(null, ['sitemap.xml'].concat(sitemaps));
        });
      },

      // Upload to s3
      (sitemaps, cb) => {
        uploadFiles(s3, sitemaps, sitemapDir, settings.s3.bucket, (err) => cb(err, sitemaps));
      }

    ], (err, sitemaps) => {
      if (err) {
        console.error('Failed to create sitemap.xml', err);
        return cb(err);
      }
      console.log('sitemap.xml created');
      cb(null, sitemaps.map((s) => `${settings.sitemapUrl}/${s}`));
    });
  };
};
