[![Build Status](https://travis-ci.org/TheScienceMuseum/collectionsonline-sitemap.svg)](https://travis-ci.org/TheScienceMuseum/collectionsonline-sitemap) [![dependencies Status](https://david-dm.org/TheScienceMuseum/collectionsonline-sitemap/status.svg)](https://david-dm.org/TheScienceMuseum/collectionsonline-sitemap)

# collectionsonline-sitemap

An AWS lambda for generating a sitemap.xml and storing it to S3.

## Getting started

1. Install [Node.js](https://nodejs.org/en/) 4.x
2. Install dependencies: `npm install`
3. Copy `settings.json.template` to `settings.json` in the project route

## Settings

### `siteUrl`
The base URL of the collections online website.

### `sitemapUrl`
The base URL of the S3 bucket where the sitemaps are stored.

### `maxSitemapUrls`
The maximum number of URLs to include in each sitemap file (50,000 is the spec max)

### `pageSize`
The size of the pages retrieved from elasticsearch.
