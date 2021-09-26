const StorageProvider = require('@smcloudstore/core/dist/StorageProvider').StorageProvider;
const Stream = require('stream').Stream;
const pathLib = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require('crypto');

/**
 * Client to interact with localstorage.
 */
class LocalStorageProvider extends StorageProvider {
    /**
     * Initializes a new client to interact with Minio.
     * 
     * @param options - Dictionary with storage options.
     */
    constructor(options) {
        if (!options || !Object.keys(options).length) {
            throw new Error('Options argument is empty');
        }
        if (!options.signingFn) {
            throw new Error('Signing function (options.signingFn) is empty');
        }

        super(null);
        this._provider = 'localstorage';
        this._basePath = options.basePath || __dirname;
        this._signingFn = options.signingFn || (() => {});
        this._client = module.exports;
    }

    /**
     * ~~Create a container ("bucket") on the server.~~
     * Does nothing because localstorage doesn't use containers.
     * 
     * @param container - An unused variable, only here for compatibility
     * @param options - An unused variable, only here for compatibility
     * @returns An empty resolved promise.
     * @async
     */
    createContainer(container, options) {
        return Promise.resolve();
    }

    /**
     * ~~Check if a container exists.~~
     * Does nothing because localstorage doesn't use containers.
     * 
     * @param container - An unused variable, only here for compatibility
     * @returns A promise that always resolves to fasle.
     * @async
     */
    isContainer(container) {
        return Promise.resolve(false);
    }

    /**
     * ~~Create a container ("bucket") on the server if it doesn't already exist.~~
     * Does nothing because localstorage doesn't use containers.
     * 
     * @param container - An unused variable, only here for compatibility
     * @param options - An unused variable, only here for compatibility
     * @returns An empty resolved promise.
     * @async
     */
    ensureContainer(container, options) {
        return Promise.resolve();
    }

    /**
     * ~~Lists all containers belonging to the user~~
     * Does nothing because localstorage doesn't use containers.
     * 
     * @returns A promise that resolves to an empty array.
     * @async
     */
    listContainers() {
        return Promise.resolve([]);
    }

    /**
     * ~~Removes a container from the server~~
     * Does nothing because localstorage doesn't use containers.
     * 
     * @param container - An unused variable, only here for compatibility
     * @returns An empty resolved promise.
     * @async
     */
    deleteContainer(container) {
        return Promise.resolve();
    }

    /**
     * Uploads a stream to the object storage server
     * 
     * @param container - An unused variable, only here for compatibility
     * @param path - Path where to store the object, relative to the base path
     * @param data - Object data or stream. Can be a Stream (Readable Stream), Buffer or string.
     * @param options - Key-value pair of options used by providers, including the `metadata` dictionary
     * @returns Promise that resolves once the object has been uploaded
     * @async
     */
    async putObject(container, path, data, options) {
        path = pathLib.join(this._basePath, sanitisePath(path));
        await mkdir(pathLib.dirname(path));

        if (data instanceof Stream || data instanceof Buffer || typeof data === "string") {
            return fs.promises.writeFile(path, data);
        } else {
            return Promise.reject(new Error('Data must be a stream, buffer or string'));
        }
    }

    /**
     * Requests an object from the server. The method returns a Promise that resolves to a Readable Stream containing the data.
     * 
     * @param container - An unused variable, only here for compatibility
     * @param path - Path of the object, relative to the base path
     * @returns A promise resolving to a Readable Stream containing the object's data
     * @async
     */
    getObject(container, path) {
        // Open the file at basePath + path
        path = pathLib.join(this._basePath, sanitisePath(path));

        try {
            let s = fs.createReadStream(path);
            return Promise.resolve(s);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Returns a list of objects with a given prefix (folder). The list is not recursive, so prefixes (folders) are returned as such.
     * 
     * @param container - An unused variable, only here for compatibility
     * @param path - Path resolving to a folder, relative to the base path
     * @returns List of elements returned by the server
     * @async
     */
    listObjects(container, path) {
        path = pathLib.join(this._basePath, sanitisePath(path));
        try {
            if (fs.statSync(path).isDirectory()) {
                let files = fs.readdirSync(path);
                let items = [];
                for (let file of files) {
                    let fullPath = pathLib.join(path, file);
                    let stats = fs.statSync(fullPath);
                    if (stats.isDirectory()) {
                        items.push({
                            prefix: file
                        });
                    } else {
                        items.push({
                            path: file,
                            size: stats.size,
                            lastModified: stats.mtime,
                            creationTime: stats.ctime,
                        });
                    }
                }
                return Promise.resolve(items);
            } else throw new Error(`Path ${path} is not a directory`);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Removes an object from the server
     * 
     * @param container - An unused variable, only here for compatibility
     * @param path - Path of the object, relative to the base path
     * @returns Promise that resolves once the object has been removed
     * @async
     */
    deleteObject(container, path) {
        path = pathLib.join(this._basePath, sanitisePath(path));

        return fs.promises.rm(path);
    }

    /**
     * Returns a URL that clients (e.g. browsers) can use to request an object from the server with a GET request,
     * even if the object is private.
     * 
     * This does no checking to ensure that the object exists!
     * 
     * @param container - An unused variable, only here for compatibility
     * @param path - Path of the object, relative to the base path
     * @param ttl - Expiry time of the URL, in seconds (default: 1 day)
     * @returns Promise that resolves with the pre-signed URL for GET requests
     * @async
     */
    presignedGetUrl(container, path, ttl) {
        ttl = !!ttl && ttl > 0 ? ttl : 86400;
        return Promise.resolve(this._signingFn("get", path, ttl));
    }

    /**
     * Returns a URL that clients (e.g. browsers) can use for PUT operations on an object in the server, even if
     * the object is private.
     * 
     * This does no checking to ensure that the object doesn't exist!
     * 
     * @param container - An unused variable, only here for compatibility
     * @param path - Path of the object, relative to the base path
     * @param options - An unused variable, only here for compatibility
     * @param ttl - Expiry time of the URL, in seconds (default: 1 day)
     * @returns Promise that resolves with the pre-signed URL for GET requests
     * @async
     */
    presignedPutUrl(container, path, options, ttl) {
        ttl = !!ttl && ttl > 0 ? ttl : 86400;
        return Promise.resolve(this._signingFn("put", path, ttl));
    }
}

function mkdir(path) {
    return fs.promises.mkdir(path, { recursive: true });
}

function sanitisePath(path) {
    return path.replace(/\.\./gi, "_..");
}

function generateRandomUid() {
    return crypto.randomBytes(24).toString("base64").replace(/\//g, "-").replace(/\=/g, "_");
}

module.exports = LocalStorageProvider;
module.exports.generateRandomUid = generateRandomUid;
module.exports.sanitisePath = sanitisePath;