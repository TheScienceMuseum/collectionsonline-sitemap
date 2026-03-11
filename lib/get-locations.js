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

    // settings.museums is the definitive allowlist of valid museum names.
    // Only these museums get top-level /search/museum/<slug> URLs, preventing
    // non-museum locations (e.g. 'Science and Innovation Park') from being
    // included. Museum names must match the exact ondisplay.value.keyword value.
    var validMuseums = new Set(settings.museums || []);

    // Generate a museum-level URL for each valid museum
    validMuseums.forEach(function (name) {
      entries.push({ loc: `${settings.siteUrl}/search/museum/${name.toLowerCase().replace(/\s+/g, '-')}` });
    });

    // Generate museum+gallery URLs from combined entries for valid museums only
    buckets.forEach(function (bucket) {
      var commaIdx = bucket.key.indexOf(', ');
      if (commaIdx === -1) return;
      var museumName = bucket.key.substring(0, commaIdx);
      if (!validMuseums.has(museumName)) return;
      var galleryName = bucket.key.substring(commaIdx + 2);
      entries.push({ loc: `${settings.siteUrl}/search/museum/${museumName.toLowerCase().replace(/\s+/g, '-')}/gallery/${galleryName.toLowerCase().replace(/\s+/g, '-')}` });
    });

    return cb(null, sitemaps.concat(entries));
  });
};
