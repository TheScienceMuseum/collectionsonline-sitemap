const test = require('tape');
const lambda = require('./');

test('Should do something', (t) => {
  t.plan(1);
  lambda.handler();
  t.ok(true);
  t.end();
});
