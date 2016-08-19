const Path = require('path');
const Async = require('async');

module.exports = (s3, filenames, dir, bucket, cb) => {
  Async.eachLimit(filenames, 2, (filename, cb) => {
    const filePath = Path.join(dir, filename);

    s3.uploadFile({
      localFile: filePath,
      s3Params: { Bucket: bucket, Key: filename, ACL: 'public-read' }
    })
    .on('error', cb)
    .on('end', () => {
      console.log(`${filename} uploaded`);
      cb();
    });
  }, cb);
};
