module.exports = (elastic, settings, sitemaps, cb) => {
  var locations = [];
  var museums = ['National Railway Museum', 'Science Museum', 'National Media Museum', 'Museum of Science and Industry'];
  var opts = {
    body: {
      size: 0,
      aggregations: {
        location: {
          terms: {
            size: 100,
            field: 'locations.name.value'
          }
        }
      }
    }
  };

  elastic.search(opts, function (err, data) {
    if (err) return cb(err);

    data.aggregations.location.buckets.forEach(el => {
      var loc;
      if (museums.indexOf(el.key) > -1) {
        loc = `${settings.siteUrl}/search/museum/${el.key.split(' ').join('%20').toLowerCase()}`;
      } else {
        loc = `${settings.siteUrl}/search/gallery/${el.key.split(' ').join('%20').toLowerCase()}`;
      }
      locations.push({loc: loc});
    });

    return cb(null, sitemaps.concat(locations));
  });
};
