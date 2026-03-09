const TypeMapping = require('./type-mapping');
const getChildImages = require('./get-child-images');
const slug = require('slug');

module.exports = (hit, elastic, settings, cb) => {
  var type = TypeMapping.toExternal(hit._source['@datatype'].base);
  var id = TypeMapping.toExternal(hit._id);
  var slugValue = hit._source.summary ? slug(hit._source.summary.title, {lower: true}) : false;
  var loc = slugValue ? `${settings.siteUrl}/${type}/${id}/${slugValue}` : `${settings.siteUrl}/${type}/${id}`;
  var lastmod = new Date(hit._source['@admin'].processed).toISOString();
  var title = hit._source.summary ? hit._source.summary.title : null;

  var ownImages = (hit._source.multimedia || []).reduce(function (acc, media) {
    if (media['@processed'] && media['@processed'].large) {
      var entry = {'image:loc': settings.imageSiteUrl + '/' + media['@processed'].large.location};
      if (title) entry['image:title'] = title;
      if (media.title && media.title.value) entry['image:caption'] = media.title.value;
      acc.push(entry);
    }
    return acc;
  }, []);

  if (!hit._source.child) {
    return finish(ownImages);
  }

  var parentUid = hit._source['@admin'].uid;

  getChildImages(elastic, settings, parentUid, function (err, childImages) {
    if (err) return finish(ownImages);

    var seen = new Set(ownImages.map(function (i) { return i['image:loc']; }));
    childImages.forEach(function (img) {
      if (!seen.has(img['image:loc'])) {
        seen.add(img['image:loc']);
        if (title) img['image:title'] = title;
        ownImages.push(img);
      }
    });

    finish(ownImages);
  });

  function finish (images) {
    var entry = {
      loc: loc,
      lastmod: lastmod,
      changefreq: 'daily'
    };
    if (images.length) entry['image:image'] = images;
    cb(null, entry);
  }
};
