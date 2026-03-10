var slug = require('slug');

module.exports = (elastic, settings, sitemaps, cb) => {
  var opts = {
    body: {
      size: 0,
      aggregations: {
        display_values: {
          terms: { size: 500, field: 'ondisplay.value.keyword' },
          aggs: {
            categories: { terms: { size: 500, field: 'category.name.keyword' } }
          }
        }
      }
    }
  };

  elastic.search(opts, function (err, data) {
    if (err) return cb(err);
    var buckets = data.body.aggregations.display_values.buckets;
    var entries = [];

    // Pass 1: identify museum names (same logic as get-locations.js)
    var museumNames = new Set(settings.standaloneMuseums || []);
    buckets.forEach(function (bucket) {
      var commaIdx = bucket.key.indexOf(', ');
      if (commaIdx !== -1) museumNames.add(bucket.key.substring(0, commaIdx));
    });

    // Collect categories per museum from all relevant buckets (both standalone
    // and combined). This ensures e.g. Locomotion gets category+museum URLs
    // even if all its objects are in galleries (no standalone bucket).
    var museumCategories = {};
    museumNames.forEach(function (name) { museumCategories[name] = new Set(); });

    buckets.forEach(function (bucket) {
      var commaIdx = bucket.key.indexOf(', ');
      var museumName = commaIdx === -1 ? bucket.key : bucket.key.substring(0, commaIdx);
      if (museumCategories[museumName]) {
        bucket.categories.buckets.forEach(function (catBucket) {
          museumCategories[museumName].add(catBucket.key);
        });
      }
    });

    // Generate category+museum URLs
    museumNames.forEach(function (name) {
      var mSlug = slug(name, { lower: true });
      museumCategories[name].forEach(function (catKey) {
        entries.push({ loc: `${settings.siteUrl}/search/categories/${slug(catKey, { lower: true })}/museum/${mSlug}` });
      });
    });

    // Generate category+museum+gallery URLs from combined entries
    buckets.forEach(function (bucket) {
      var commaIdx = bucket.key.indexOf(', ');
      if (commaIdx === -1) return;
      var museumName = bucket.key.substring(0, commaIdx);
      var galleryName = bucket.key.substring(commaIdx + 2);
      var mSlug = slug(museumName, { lower: true });
      var gSlug = slug(galleryName, { lower: true });
      bucket.categories.buckets.forEach(function (catBucket) {
        entries.push({
          loc: `${settings.siteUrl}/search/categories/${slug(catBucket.key, { lower: true })}/museum/${mSlug}/gallery/${gSlug}`
        });
      });
    });

    return cb(null, sitemaps.concat(entries));
  });
};
