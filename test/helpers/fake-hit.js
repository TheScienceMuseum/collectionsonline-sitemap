const Faker = require('faker');

module.exports = () => {
  const type = Faker.random.arrayElement(['object', 'person', 'agent']);
  const id = `smg-${type}-${Faker.random.number()}`;
  return {
    _id: id,
    _type: type,
    _source: {
      '@admin': { processed: Faker.date.past().getTime() },
      '@datatype': { base: type }
    }
  };
};
