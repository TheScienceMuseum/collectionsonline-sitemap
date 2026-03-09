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

    // Pass 1: identify museum names from combined 'Museum, Gallery' entries
    var museumNames = new Set();
    buckets.forEach(function (bucket) {
      var commaIdx = bucket.key.indexOf(', ');
      if (commaIdx !== -1) museumNames.add(bucket.key.substring(0, commaIdx));
    });

    // Pass 2: generate museum and museum+gallery URLs
    buckets.forEach(function (bucket) {
      var key = bucket.key;
      var commaIdx = key.indexOf(', ');

      if (commaIdx === -1) {
        if (!museumNames.has(key)) return; // standalone gallery name, skip
        entries.push({ loc: `${settings.siteUrl}/search/museum/${slug(key, { lower: true })}` });
      } else {
        var museumName = key.substring(0, commaIdx);
        var galleryName = key.substring(commaIdx + 2);
        var mSlug = slug(museumName, { lower: true });
        var gSlug = slug(galleryName, { lower: true });
        entries.push({ loc: `${settings.siteUrl}/search/museum/${mSlug}/gallery/${gSlug}` });
      }
    });

    return cb(null, sitemaps.concat(entries));
  });
};
