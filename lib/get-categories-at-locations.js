const Async = require('async');

module.exports = (elastic, settings, sitemaps, cb) => {
  var categories = [];

  Async.each([
    'National Railway Museum',
    'Science Museum',
    'National Media Museum',
    'Museum of Science and Industry'
  ], (museum, cb) => {
    var opts = {
      body: {
        size: 0,
        aggs: {
          category: {
            filter: {term: {'facility.name.keyword': museum}},
            aggs: {
              category: {
                terms: {
                  size: 25,
                  field: 'category.name.keyword'
                }
              }
            }
          }
        }
      }
    };

    elastic.search(opts, function (err, data) {
      if (err) return cb(err);

      data.body.aggregations.category.category.buckets.forEach(el => {
        const loc = `${settings.siteUrl}/search/museum/${museum.split(' ').join('-').toLowerCase()}/categories/${el.key.split(' ').join('-').toLowerCase()}`;
        categories.push({loc: loc});
      });

      cb();
    });
  }, (err) => {
    if (err) return cb(err);

    return cb(null, sitemaps.concat(categories));
  });
};
