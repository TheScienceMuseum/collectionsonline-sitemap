const TypeMapping = require('./type-mapping');

module.exports = (hit, siteUrl) => {
  const type = TypeMapping.toExternal(hit._type);
  const id = TypeMapping.toExternal(hit._id);

  return {
    loc: `${siteUrl}/${type}/${id}`,
    lastmod: new Date(hit._source.admin.modified).toISOString(),
    changefreq: 'daily'
  };
};
