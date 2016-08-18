const settings = require('./settings.json');

exports.handler = (event, context) => {
  console.log('MY LAMBDA', settings);
};
