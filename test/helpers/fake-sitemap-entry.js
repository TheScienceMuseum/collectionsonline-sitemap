const Faker = require('faker');

module.exports = () => ({
  loc: Faker.internet.url(),
  lastmod: Faker.date.past().toISOString(),
  changefreq: 'daily'
});
