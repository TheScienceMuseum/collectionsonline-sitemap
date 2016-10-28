const TypeMapping = require('./type-mapping');
const slug = require('slug');

module.exports = (hit, siteUrl) => {
  const type = TypeMapping.toExternal(hit._type);
  const id = TypeMapping.toExternal(hit._id);
  const slugValue = hit._source.summary_title && slug(hit._source.summary_title, {lower: true});
  const loc = slugValue ? `${siteUrl}/${type}/${id}/${slugValue}` : `${siteUrl}/${type}/${id}`;
  return {
    loc: loc,
    lastmod: new Date(hit._source.admin.modified).toISOString(),
    changefreq: 'daily'
  };
};
