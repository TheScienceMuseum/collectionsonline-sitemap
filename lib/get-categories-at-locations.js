const encodeFilterValue = require('./encode-filter-value');

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

    // settings.museums is the definitive allowlist of valid museum names.
    var validMuseums = new Set(settings.museums || []);

    // Collect categories per museum from all relevant buckets (both standalone
    // and combined 'Museum, Gallery' entries) for valid museums only.
    var museumCategories = {};
    validMuseums.forEach(function (name) { museumCategories[name] = new Set(); });

    buckets.forEach(function (bucket) {
      var commaIdx = bucket.key.indexOf(', ');
      var museumName = commaIdx === -1 ? bucket.key : bucket.key.substring(0, commaIdx);
      if (museumCategories[museumName]) {
        bucket.categories.buckets.forEach(function (catBucket) {
          museumCategories[museumName].add(catBucket.key);
        });
      }
    });

    var toUrlPart = encodeFilterValue;

    // Generate category+museum URLs for valid museums
    validMuseums.forEach(function (name) {
      var mSlug = toUrlPart(name);
      museumCategories[name].forEach(function (catKey) {
        entries.push({ loc: `${settings.siteUrl}/search/categories/${toUrlPart(catKey)}/museum/${mSlug}` });
      });
    });

    // Generate category+museum+gallery URLs from combined entries for valid museums only
    buckets.forEach(function (bucket) {
      var commaIdx = bucket.key.indexOf(', ');
      if (commaIdx === -1) return;
      var museumName = bucket.key.substring(0, commaIdx);
      if (!validMuseums.has(museumName)) return;
      var galleryName = bucket.key.substring(commaIdx + 2);
      var mSlug = toUrlPart(museumName);
      var gSlug = toUrlPart(galleryName);
      bucket.categories.buckets.forEach(function (catBucket) {
        entries.push({
          loc: `${settings.siteUrl}/search/categories/${toUrlPart(catBucket.key)}/museum/${mSlug}/gallery/${gSlug}`
        });
      });
    });

    return cb(null, sitemaps.concat(entries));
  });
};
