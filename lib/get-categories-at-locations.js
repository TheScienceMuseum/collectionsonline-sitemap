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

    // Pass 1: identify museum names from combined 'Museum, Gallery' entries,
    // plus any explicitly listed standalone museums (e.g. Locomotion which has
    // no individual gallery pages).
    var museumNames = new Set(settings.standaloneMuseums || []);
    buckets.forEach(function (bucket) {
      var commaIdx = bucket.key.indexOf(', ');
      if (commaIdx !== -1) museumNames.add(bucket.key.substring(0, commaIdx));
    });

    // Pass 2: generate category URLs for museum and museum+gallery combinations
    buckets.forEach(function (bucket) {
      var key = bucket.key;
      var commaIdx = key.indexOf(', ');
      var urlSuffix;

      if (commaIdx === -1) {
        if (!museumNames.has(key)) return; // standalone gallery name, skip
        urlSuffix = `/museum/${slug(key, { lower: true })}`;
      } else {
        var museumName = key.substring(0, commaIdx);
        var galleryName = key.substring(commaIdx + 2);
        urlSuffix = `/museum/${slug(museumName, { lower: true })}/gallery/${slug(galleryName, { lower: true })}`;
      }

      bucket.categories.buckets.forEach(function (catBucket) {
        entries.push({
          loc: `${settings.siteUrl}/search/categories/${slug(catBucket.key, { lower: true })}${urlSuffix}`
        });
      });
    });

    return cb(null, sitemaps.concat(entries));
  });
};
