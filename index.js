const { Client } = require('@elastic/elasticsearch');

const createS3Client = require('s3').createClient;
const createHandler = require('./handler');
const settings = require('./settings.json');

const elastic = new Client(settings.elasticsearch);

const s3 = createS3Client({ s3Options: settings.s3 });
const handler = createHandler(elastic, s3, settings);

exports.handler = handler;
