const encodeFilterValue = require('./encode-filter-value');

module.exports = (elastic, settings, sitemaps, cb) => {
  var collections = [];
  var opts = {
    body: {
      size: 0,
      aggregations: {
        collection: {
          terms: {
            size: 1000,
            field: 'cumulation.collector.summary.title.keyword'
          }
        }
      }
    }
  };

  elastic.search(opts, function (err, data) {
    if (err) return cb(err);

    data.body.aggregations.collection.buckets.forEach(el => {
      const loc = `${settings.siteUrl}/search/collection/${encodeFilterValue(el.key)}`;
      collections.push({ loc: loc });
    });

    return cb(null, sitemaps.concat(collections));
  });
};
