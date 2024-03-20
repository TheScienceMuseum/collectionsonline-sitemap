const Async = require('async');

// Scroll over the elasticsearch index
// https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-scroll.html
module.exports = (elastic, opts, cb) => {
  opts = opts || {};
  opts.batchSize = opts.batchSize || 25;
  opts.pageSize = opts.pageSize || 25;

  const onHit = opts.onHit || ((hit) => hit);
  const onBatch = opts.onBatch || null;

  var batch = [];
  var numProcessed = 0;

  const searchOpts = {
    index: 'ciim',
    size: opts.pageSize,
    scroll: '30s', // Set to 30 seconds because we are calling right back
    body: {
      query: {
        bool: {
          must: {
            match_all: {}
          },
          filter: {
            terms: {
              '@datatype.base': ['agent', 'archive', 'object']
            }
          }
        }
      }
    }
  };

  if (opts.fields) {
    searchOpts._source = opts.fields;
  }

  elastic.search(searchOpts, function scroll (err, res) {
    if (err) return cb(err);

    const iterate = (hit, cb) => {
      batch.push(onHit(hit));
      numProcessed++;

      if (onBatch && batch.length >= opts.batchSize) {
        onBatch(batch.slice(0, opts.batchSize), (err) => {
          if (err) return cb(err);
          batch = batch.slice(opts.batchSize);
          cb();
        });
      } else {
        Async.setImmediate(cb);
      }
    };

    Async.eachSeries(res.body.hits.hits, iterate, (err) => {
      if (err) return cb(err);

      if (res.body.hits.total === numProcessed) {
        if (onBatch && batch.length) { // Send final batch if there is some
          return onBatch(batch, (err) => cb(err, []));
        } else {
          return cb(null, batch);
        }
      }
      elastic.scroll({ scrollId: res.body._scroll_id, scroll: '30s' }, scroll);
    });
  });
};
