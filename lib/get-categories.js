module.exports = (elastic, settings, sitemaps, cb) => {
  var categories = [];
  var opts = {
    body: {
      size: 0,
      aggregations: {
        category: {
          terms: {
            size: 250,
            field: 'categories.name.keyword'
          }
        }
      }
    }
  };

  elastic.search(opts, function (err, data) {
    if (err) return cb(err);

    data.aggregations.category.buckets.forEach(el => {
      const loc = `${settings.siteUrl}/search/categories/${el.key.split(' ').join('-').toLowerCase()}`;
      categories.push({loc: loc});
    });

    return cb(null, sitemaps.concat(categories));
  });
};
