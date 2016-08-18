const Fs = require('fs');
const convert = require('data2xml')();

module.exports = (sitemapFilenames, sitemapUrl, filePath, cb) => {
  const now = new Date().toISOString();

  const xml = convert('sitemapindex', {
    _attr: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' },
    sitemap: sitemapFilenames.map((filename) => ({
      loc: `${sitemapUrl}/${filename}`,
      lastmod: now
    }))
  });

  Fs.writeFile(filePath, xml, cb);
};
