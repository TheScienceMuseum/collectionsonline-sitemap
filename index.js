const { Client } = require('@elastic/elasticsearch');
const { S3Client } = require('@aws-sdk/client-s3');
const createHandler = require('./handler');
const settings = require('./settings.json');

const elastic = new Client(settings.elasticsearch);

const s3 = new S3Client({
  region: settings.s3.region || 'eu-west-1',
  credentials: {
    accessKeyId: settings.s3.accessKeyId,
    secretAccessKey: settings.s3.secretAccessKey
  }
});

const handler = createHandler(elastic, s3, settings);

exports.handler = handler;
