/**
 * Encodes a filter value for use in a URL path segment.
 *
 * Encoding scheme:
 *   space  → -        (human-readable, SEO-friendly)
 *   hyphen → %252D    (double-encoded so Hapi's %25→% pass leaves %2D,
 *                      then decodeURIComponent restores the hyphen)
 *   slash  → %252F    (same double-encoding scheme)
 *   comma  → %252C    (same double-encoding scheme)
 *
 * This must match the encodeFilterValue helper in the main collectionsonline app
 * (lib/helpers/encode-filter-value.js) so sitemap URLs round-trip correctly.
 *
 * @param {string} value - Raw filter value from Elasticsearch (e.g. "Burgoyne-Johnson Collection")
 * @returns {string} URL-safe path segment
 */
module.exports = function encodeFilterValue (value) {
  return value
    .replace(/-/g, '%252D') // encode hyphens before spaces become dashes
    .replace(/\//g, '%252F') // encode slashes
    .replace(/,/g, '%252C') // encode commas
    .replace(/\s+/g, '-') // spaces → dashes (human-readable)
    .toLowerCase();
};
