const Path = require('path');
const Async = require('async');

module.exports = (s3, filenames, dir, bucket, cb) => {
  Async.each(filenames, (filename, cb) => {
    const filePath = Path.join(dir, filename);

    s3.uploadFile({
      localFile: filePath,
      s3Params: { Bucket: bucket, Key: filename }
    })
    .on('error', cb)
    .on('end', () => {
      console.log(`${filename} uploaded`);
      cb();
    });
  }, cb);
};
