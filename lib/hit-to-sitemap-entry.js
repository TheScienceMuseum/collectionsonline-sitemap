const TypeMapping = require('./type-mapping');
const slug = require('slug');

module.exports = (hit, siteUrl) => {
  const type = TypeMapping.toExternal(hit._source['@datatype'].base);
  const id = TypeMapping.toExternal(hit._id);
  const slugValue = hit._source.summary ? slug(hit._source.summary.title, {lower: true}) : false;
  const loc = slugValue ? `${siteUrl}/${type}/${id}/${slugValue}` : `${siteUrl}/${type}/${id}`;
  const lastmod = new Date(hit._source['@admin'].processed).toISOString();
  return {
    loc: loc,
    lastmod: lastmod,
    changefreq: 'daily'
  };
};
