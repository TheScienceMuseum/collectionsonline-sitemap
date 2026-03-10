var slug = require('slug');

module.exports = (elastic, settings, sitemaps, cb) => {
  var opts = {
    body: {
      size: 0,
      aggregations: {
        display_values: {
          terms: { size: 500, field: 'ondisplay.value.keyword' }
        }
      }
    }
  };

  elastic.search(opts, function (err, data) {
    if (err) return cb(err);
    var buckets = data.body.aggregations.display_values.buckets;
    var entries = [];

    // Pass 1: identify museum names from combined 'Museum, Gallery' entries,
    // plus any explicitly listed standaloneMuseums. This ensures museums like
    // Locomotion get a top-level museum URL even if all their objects are
    // assigned to specific galleries (so no standalone bucket exists).
    var museumNames = new Set(settings.standaloneMuseums || []);
    buckets.forEach(function (bucket) {
      var commaIdx = bucket.key.indexOf(', ');
      if (commaIdx !== -1) museumNames.add(bucket.key.substring(0, commaIdx));
    });

    // Generate a museum-level URL for every identified museum
    museumNames.forEach(function (name) {
      entries.push({ loc: `${settings.siteUrl}/search/museum/${slug(name, { lower: true })}` });
    });

    // Generate museum+gallery URLs from combined entries
    buckets.forEach(function (bucket) {
      var commaIdx = bucket.key.indexOf(', ');
      if (commaIdx === -1) return; // standalone entries don't drive gallery URLs
      var museumName = bucket.key.substring(0, commaIdx);
      var galleryName = bucket.key.substring(commaIdx + 2);
      entries.push({ loc: `${settings.siteUrl}/search/museum/${slug(museumName, { lower: true })}/gallery/${slug(galleryName, { lower: true })}` });
    });

    return cb(null, sitemaps.concat(entries));
  });
};
