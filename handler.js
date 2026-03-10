const Path = require('path');
const mkdirp = require('mkdirp');
const Async = require('async');
const scrollIndex = require('./lib/scroll-index');
const hitToSitemapEntry = require('./lib/hit-to-sitemap-entry');
const createSitemap = require('./lib/create-sitemap');
const createSitemapIndex = require('./lib/create-sitemap-index');
const uploadFiles = require('./lib/upload-files');
const getCategories = require('./lib/get-categories');
const getLocations = require('./lib/get-locations');
const getCategoriesAtLocations = require('./lib/get-categories-at-locations');
const getCollections = require('./lib/get-collections');

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

      // Categories → category-sitemap.xml
      (cb) => {
        getCategories(elastic, settings, [], (err, entries) => {
          if (err) return cb(err);
          const filename = 'category-sitemap.xml';
          const filePath = Path.join(sitemapDir, filename);
          createSitemap(entries, filePath, (err) => {
            if (err) return cb(err);
            console.log(`${filename} created`);
            cb(null, [filename]);
          });
        });
      },

      // Museums + galleries + category-at-location pages → museum-sitemap.xml
      (sitemaps, cb) => {
        Async.waterfall([
          (cb) => getLocations(elastic, settings, [], cb),
          (entries, cb) => getCategoriesAtLocations(elastic, settings, entries, cb)
        ], (err, entries) => {
          if (err) return cb(err);
          const filename = 'museum-sitemap.xml';
          const filePath = Path.join(sitemapDir, filename);
          createSitemap(entries, filePath, (err) => {
            if (err) return cb(err);
            console.log(`${filename} created`);
            cb(null, sitemaps.concat([filename]));
          });
        });
      },

      // Named collections → collection-sitemap.xml
      (sitemaps, cb) => {
        getCollections(elastic, settings, [], (err, entries) => {
          if (err) return cb(err);
          const filename = 'collection-sitemap.xml';
          const filePath = Path.join(sitemapDir, filename);
          createSitemap(entries, filePath, (err) => {
            if (err) return cb(err);
            console.log(`${filename} created`);
            cb(null, sitemaps.concat([filename]));
          });
        });
      },

      // Scroll all record types → sitemap-N.xml
      (sitemaps, cb) => {
        scrollIndex(elastic, {
          batchSize: settings.maxSitemapUrls,
          pageSize: settings.pageSize,
          fields: ['@admin.uid', '@admin.processed', '@datatype.base', 'summary.title', 'multimedia', 'child'],

          onHit: (hit, cb) => hitToSitemapEntry(hit, elastic, settings, cb),

          onBatch: (entries, batchCb) => {
            const filename = `sitemap-${sitemaps.length}.xml`;
            const filePath = Path.join(sitemapDir, filename);

            createSitemap(entries, filePath, (err) => {
              if (err) return batchCb(err);
              console.log(`${filename} created`);
              sitemaps.push(filename);
              batchCb();
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
