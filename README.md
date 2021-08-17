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

In the `storage.presignedPutUrl(container, path, [options], [ttl])` and equivalent `get` methods, the LocalStorage provider ignores the `container` and `options` argument, which have no effect.

What is returned, however, is a promise that is resolved using your `signingFn` function which should return a string (being the final URL). The design intent is to allow you to generate and store a link in your database with a reference to the file to get/put. This gives you full control over how you manage these links.

An example `signingFn` could be:
```js
// Signing function
async function signingFn(method, path, ttl) {
    let token;
    let curUrl = await db.signedUrls.get(method, path);
    if(curUrl !== null) {
        token = curUrl.token;
        await db.signedUrls.update(method, path, token, Date.now() + (ttl * 1000));
    } else {
        token = storage.client.generateRandomUid();
        await db.signedUrls.put(method, path, token, Date.now() + (ttl * 1000));
    }
    return token;
}

// Usage in express
app.get('/download/:token', (req, res) => {
    let token = req.params.token;
    let url = await db.signedUrls.get(token);
    if(url !== null && url.expire > Date.now()) {
        if(url.method !== "get") return res.status(405).send("405 Method Not Allowed").end();
        return (await storage.getObject(null, url.path)).pipe(res);
    }
    else return res.status(404).send("404 Not Found").end();
});
// .. and do something similar for put
```

### Accessing the LocalStorage library

The LocalStorage provider is built from the ground up and has a couple of additional helper functions, which are exposed by calling `storage.client()`.

By accessing this object, you have access to:
- `generateRandomUid()`,
- `sanitisePath(path)`
