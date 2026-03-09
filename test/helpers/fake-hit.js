const Faker = require('faker');

module.exports = (opts) => {
  opts = opts || {};
  const type = opts.type || Faker.random.arrayElement(['object', 'person', 'agent']);
  const id = opts.id || `smg-${type}-${Faker.random.number()}`;
  const hit = {
    _id: id,
    _type: type,
    _source: {
      '@admin': { uid: id, processed: Faker.date.past().getTime() },
      '@datatype': { base: type }
    }
  };

  if (opts.multimedia) {
    hit._source.multimedia = opts.multimedia;
  }

  if (opts.child) {
    hit._source.child = opts.child;
  }

  if (opts.summary) {
    hit._source.summary = opts.summary;
  }

  return hit;
};
