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
          fields: ['admin.modified', 'summary_title'],

          // Transform a hit into a sitemap entry
          onHit: (hit) => hitToSitemapEntry(hit, settings.siteUrl),

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
