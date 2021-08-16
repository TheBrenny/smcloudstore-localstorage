(function () {
    'use strict';

    const StorageProvider = require('@smcloudstore/core/dist/StorageProvider').StorageProvider;
    const Stream = require('stream').Stream;

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
            //this._client = create something to read/write with
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
        putObject(container, path, data, options) {
            // Save the file to basePath + path 
            // Resolve the promise once the object has been uploaded
            return Promise.resolve();
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
            // Resolve the promise with the stream
            return Promise.resolve();
        }

        /**
         * Returns a list of objects with a given prefix (folder). The list is not recursive, so prefixes (folders) are returned as such.
         * 
         * @param container - An unused variable, only here for compatibility
         * @param path - Path resolving to a folder, relative to the base path
         * @returns List of elements returned by the server
         * @async
         */
        listObjects(container, prefix) {
            // Identify the items in the folder
            // Resolve the promise with a list of objects resolving to:
            // {
            //     /** Full path of the object inside the container */
            //     path: string
            //     /** Size in bytes of the object */
            //     size: number
            //     /** Date when the object was last modified */
            //     lastModified: Date
            //     /** Date when the object was created */
            //     creationTime ? : Date
            //     /** Content-Type header of the object, if present */
            //     contentType ? : string
            //     /** MD5 digest of the object, if present */
            //     contentMD5 ? : string
            //     /** SHA1 digest of the objet, if present */
            //     contentSHA1 ? : string
            // }
            // OR
            // {
            //     /** Name of the prefix */
            //     prefix: string
            // }

            return Promise.resolve([]);
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
            // Delete the object at basePath + path
            // Resolve the promise once the object has been removed
            return Promise.resolve();
        }

        /**
         * Returns a URL that clients (e.g. browsers) can use to request an object from the server with a GET request, even if the object is private.
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
         * Returns a URL that clients (e.g. browsers) can use for PUT operations on an object in the server, even if the object is private.
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

    module.exports = LocalStorageProvider;
}());