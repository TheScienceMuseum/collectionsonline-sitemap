const Path = require('path');
const Fs = require('fs');
const Async = require('async');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

module.exports = (s3, filenames, dir, bucket, cb) => {
  Async.eachLimit(filenames, 2, (filename, done) => {
    const filePath = Path.join(dir, filename);
    const body = Fs.readFileSync(filePath);

    s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: body,
      ACL: 'public-read',
      ContentType: 'application/xml'
    }))
    .then(() => {
      console.log(`${filename} uploaded`);
      done();
    })
    .catch(done);
  }, cb);
};
