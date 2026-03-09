# collectionsonline-sitemap

An AWS lambda for generating a sitemap.xml and storing it to S3.

## Getting started

1. Install [Node.js](https://nodejs.org/en/) 22.x LTS (use [nvm](https://github.com/nvm-sh/nvm): `nvm use`)
2. Install dependencies: `npm install`
3. Copy `settings.json.template` to `settings.json` in the project root

## Settings

### `siteUrl`
The base URL of the collections online website.

### `sitemapUrl`
The base URL of the S3 bucket where the sitemaps are stored.

### `maxSitemapUrls`
The maximum number of URLs to include in each sitemap file. Recommended: `10000` — keeps files well under the 50MB/50,000 URL spec limits, especially with image entries included.

### `pageSize`
The size of the pages retrieved from elasticsearch.

### `tmpDir`
Temporary directory where the sitemap files are stored. For running on AWS this should be set to `/tmp` but recommended to be `tmp` for local dev.

### `elasticsearch`
Connection details for the elasticsearch index to use.

### `s3`
AWS S3 bucket name and access credentials for where to put the sitemap files. These credentials should have permissions to write to and set permissions on the bucket.

## Deploy

1. Install just the dependencies needed for running the lambda

    ```sh
    rm -rf node_modules
    npm install --production
    ```

2. Zip the lambda ready for upload

    ```sh
    npm run build # (Built ZIP can be found in dist/sitemap-vX.Y.Z.zip
    ```

3. Use AWS console to create a new lambda
    * Choose **lambda-canary** blueprint
    * Name **trigger** and set rate to "1 day"
    * Name function "sitemapGenerator"
    * Runtime **Node.js 22.x**
    * Choose **Upload a .ZIP file**
    * Set **handler** to "index.handler"
    * Choose **Create new role from template(s)**
    * Set **memory** to "512"
    * Set **timeout** to "5 mins"
