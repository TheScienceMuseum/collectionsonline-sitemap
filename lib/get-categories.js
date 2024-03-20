module.exports = (elastic, settings, sitemaps, cb) => {
  var categories = [];
  var opts = {
    body: {
      size: 0,
      aggregations: {
        category: {
          terms: {
            size: 1000,
            field: 'category.name.keyword'
          }
        }
      }
    }
  };

  elastic.search(opts, function (err, data) {
    if (err) return cb(err);

    data.body.aggregations.category.buckets.forEach(el => {
      const loc = `${settings.siteUrl}/search/categories/${el.key.split(' ').join('-').toLowerCase()}`;
      categories.push({loc: loc});
    });

    return cb(null, sitemaps.concat(categories));
  });
};
