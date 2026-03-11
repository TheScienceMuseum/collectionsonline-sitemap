const test = require('tape');
const encodeFilterValue = require('../lib/encode-filter-value');

test('encodeFilterValue: spaces become dashes', function (t) {
  t.equal(encodeFilterValue('Flight Collection'), 'flight-collection');
  t.end();
});

test('encodeFilterValue: hyphens become %252D', function (t) {
  t.equal(encodeFilterValue('Burgoyne-Johnson Collection'), 'burgoyne%252djohnson-collection');
  t.end();
});

test('encodeFilterValue: slashes become %252F', function (t) {
  t.equal(encodeFilterValue('Buckingham Movie Museum/John Smith'), 'buckingham-movie-museum%252fjohn-smith');
  t.end();
});

test('encodeFilterValue: commas become %252C', function (t) {
  t.equal(encodeFilterValue('People, Pride and Progress'), 'people%252c-pride-and-progress');
  t.end();
});

test('encodeFilterValue: combined special characters', function (t) {
  t.equal(
    encodeFilterValue('Buckingham Movie Museum/John Burgoyne-Johnson Collection'),
    'buckingham-movie-museum%252fjohn-burgoyne%252djohnson-collection'
  );
  t.end();
});

test('encodeFilterValue: output is lowercase', function (t) {
  t.equal(encodeFilterValue('Science Museum'), 'science-museum');
  t.end();
});
