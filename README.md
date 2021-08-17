# smcloudstore-localstorage

This package is a provider for [SMCloudStore](https://github.com/ItalyPaleAle/SMCloudStore), for local storage hosting. SMCloudStore is a lightweight Node.js module that offers a simple API to interact with the object storage services of multiple cloud providers.

Please refer to the [main package](https://github.com/ItalyPaleAle/SMCloudStore) for the SMCloudStore documentation and instructions on how to use it.

## Provider-specific considerations

There are a few provider-specific considerations for the LocalStorage provider.

### Connection argument

When initializing the LocalStorage provider, the `options` argument is an object with:

- `options.signingFn`: `function(method, path, ttl)` returning a `String` (which can be promised) which returns a publically accessible URL to download/upload from/to the specified path. It should also only last for `ttl` seconds. (`generateRandUid()` is exposed to help generate random URL IDs.)
- `options.basePath` (optional): string representing the base path to store files in(default: ``${__dirname}/storage``)

Example:

````js
// Require the package
const SMCloudStore = require('smcloudstore')

// Complete with the connection options for LocalStorage
const options = {
    signingFn: (method, path, ttl) => console.log("store the method/path/ttl combo in a DB for later use with a generic route"),
    basePath: __dirname + '/app/storage',
}

// Return an instance of the GenericS3Provider class
const storage = SMCloudStore.create('localstorage', options)
````

### Using pre-signed URLs

In the method [`storage.presignedPutUrl(container, path, [options], [ttl])`](https://italypaleale.github.io/SMCloudStore/classes/generic_s3.generics3provider.html#presignedputurl), the Generic S3 provider ignores the `options` argument, which has no effect on the generated tokens.

### Accessing the Minio library

The Generic S3 provider is built on top of the [Minio JavaScript client](https://github.com/minio/minio-js), which is exposed by calling [`storage.client()`](https://italypaleale.github.io/SMCloudStore/classes/generic_s3.generics3provider.html#client).

You can use the object returned by this method to perform low-level operations using the Minio client.
