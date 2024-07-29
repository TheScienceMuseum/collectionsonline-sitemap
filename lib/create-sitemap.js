const Fs = require('fs');
const convert = require('data2xml')();

module.exports = (entries, filePath, cb) => {
  const xml = convert('urlset', {
    _attr: {
      xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
      'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation': 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd'
    },
    url: entries
  });
  Fs.writeFile(filePath, xml, cb);
};
