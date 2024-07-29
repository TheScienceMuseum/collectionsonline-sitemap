const TypeMapping = require('./type-mapping');
const slug = require('slug');

module.exports = (hit, siteUrl, imageSiteUrl) => {
  const type = TypeMapping.toExternal(hit._source['@datatype'].base);
  const id = TypeMapping.toExternal(hit._id);
  const slugValue = hit._source.summary ? slug(hit._source.summary.title, {lower: true}) : false;
  const loc = slugValue ? `${siteUrl}/${type}/${id}/${slugValue}` : `${siteUrl}/${type}/${id}`;
  const lastmod = new Date(hit._source['@admin'].processed).toISOString();
  var images;
  if (hit._source['multimedia']) {
    images = hit._source['multimedia'].map(function (image) {
      if (image['@processed'] && image['@processed'].large) {
        return { 'image:loc': imageSiteUrl + '/' + image['@processed'].large.location };
      }
    });
  }
  return {
    loc: loc,
    ...images && { 'image:image': images },
    lastmod: lastmod,
    changefreq: 'daily'
  };
};
