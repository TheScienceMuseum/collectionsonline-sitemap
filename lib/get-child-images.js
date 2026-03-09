module.exports = (elastic, settings, parentUid, cb) => {
  var opts = {
    index: 'ciim',
    size: 100,
    body: {
      query: {
        bool: {
          must: [
            { term: { 'grouping.@admin.uid': parentUid } },
            { term: { 'grouping.@link.type': 'SPH' } }
          ]
        }
      },
      _source: ['multimedia']
    }
  };

  elastic.search(opts, function (err, data) {
    if (err) return cb(err, []);

    var images = [];
    var seen = new Set();

    data.body.hits.hits.forEach(function (hit) {
      if (!hit._source.multimedia) return;
      hit._source.multimedia.forEach(function (media) {
        if (media['@processed'] && media['@processed'].large) {
          var loc = settings.imageSiteUrl + '/' + media['@processed'].large.location;
          if (!seen.has(loc)) {
            seen.add(loc);
            images.push({ 'image:loc': loc });
          }
        }
      });
    });

    cb(null, images);
  });
};
