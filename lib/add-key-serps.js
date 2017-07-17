const Async = require('async');
const getCategories = require('./get-categories');
const getLocations = require('./get-locations');
const getCategoriesAtLocations = require('./get-categories-at-locations');

module.exports = (elastic, settings, sitemaps, cb) => {
  Async.waterfall([
    (cb) => getCategories(elastic, settings, sitemaps, cb),

    (sitemaps, cb) => getLocations(elastic, settings, sitemaps, cb),

    (sitemaps, cb) => getCategoriesAtLocations(elastic, settings, sitemaps, cb)

  ], (err, result) => {
    if (err) console.log(err);

    cb(null, sitemaps.concat(result));
  });
};
