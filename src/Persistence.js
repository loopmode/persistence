const instances = [];

const DEFAULT_PUBLIC_PATH = '/';

if (!window.__persistenceInitialized) {
    window.__persistenceInitialized = true;
    window.addEventListener('beforeunload', function persistAll() {
        instances.forEach(instance => {
            if (instance.enabled) {
                try {
                    instance.save();
                } catch (error) {
                    console.warn('[Persistence] Failed saving', {
                        error,
                        instance
                    });
                }
            }
        });
    });
}

/**
 * A wrapper for persisting data to `localStorage` or `sessionStorage`.
 * You can create multiple instances but you must provide unique names;
 *
 * The API resembles the one from the web storage objects: setItem(key, vaue), getItem(key), removeItem(key).
 *
 * There are shortcuts for these, `set()`, `get()` and `remove()`,
 * we should deprecate them, that way we stay directly exchangeable with the bare web storage backend, e.g. window.localStorage.
 *
 * In order to avoid expensive JSON serialization/deserialization by interacting with the storage backend, the data is held in memory (in a simple object).
 * All operations operate on that plain object. An event listener is registered for window.beforeunload, and only then do we serialize the data to a JSON string.
 * The string is then persisted to the backend storage, e.g. window.localStorage.
 *
 * TODO: Always keep an eye on performance, evaluate whether this mechanism is a bottleneck.
 *
 * @example
 * const myCache = new Persistence('myCache');
 * console.log(myCache.getItem('started'));
 * myCache.setItem('started', new Date());
 *
 * @author jovica.aleksic@xailabs.de
 */
class Persistence {
    //
    // Static API
    //
    //--------------------------------------------------------------------
    static logging = false;

    static get instances() {
        return [...instances];
    }

    /**
     * Returns an already existing instance for a given name or creates a new one
     */
    static connect(name, options) {
        const instance = Persistence.get(`[${options.publicPath || DEFAULT_PUBLIC_PATH}]${name}`);
        if (instance) {
            if (options) {
                instance.init(options);
            }
            return instance;
        }
        return new Persistence(name, options);
    }
    /**
     * Get a store by its qualified name, including portal type, publicPath etc
     */
    static get(name) {
        return instances.find(storage => storage.name === name);
    }
    /**
     * Finds a store by partial name match
     */
    static find(name) {
        return instances.find(storage => storage.name.match(name));
    }
    /**
     * Returns an array containing all instances
     */
    static getAll() {
        return instances.reduce((result, instance) => {
            result[instance.name] = instance;
            return result;
        }, {});
    }
    /**
     * Clears all storages
     */
    static clearAll(options = {}) {
        const onlyIncluded = instance => !options.only || options.only.find(name => instance.name.match(name));
        const notExcluded = instance => !options.not || !options.not.find(name => instance.name.match(name));
        const cleared = instances
            .filter(onlyIncluded)
            .filter(notExcluded)
            .map(storage => {
                storage.clear();
                return storage;
            });
        const skipped = instances.filter(instance => cleared.indexOf(instance) === -1);
        Persistence.logging &&
            console.info(
                '[Persistence]',
                cleared.length ? `\n\tcleared: ${cleared.map(instance => instance.name)}` : '',
                skipped.length ? `\n\tskipped: ${skipped.map(instance => instance.name)}` : ''
            );
    }
    /**
     * Retrieves the size of the occupied space in storage, of all instances.
     * Seems to approximate bytes.
     */
    static getSize() {
        return instances.reduce((result, storage) => {
            return result + storage.getSize();
        }, 0);
    }

    //
    // Instance API
    //
    //--------------------------------------------------------------------

    logging = false;

    /**
     * Creates a new Persistence object.
     * A Persistence stores its data in a simple object (in memory) and persists the data as a JSON string to localSrorage before the window unloads, indexed by its `name`.
     * When initializing, it looks for previously stored data in localStorage, and parses it to an object.
     *
     * This means that you can set and get values without an performance penalty, JSON conversion only happens at startup and before unload.
     *
     * You can specify a name to enable multiple apps on the same origin without collisions in data.
     * (Consider that localStorage is shared per origin (protocol, host, port), so if you want to have two _instances in /a and /b, you can use those paths as names for the Persistence)
     *
     * If a `maxAge` is specified, the data will be cleared on startup if the last update is too long ago.
     *
     * @param {string} name - A unique name for this backend object.
     * @param {object} options -
     * @param {object} options.autoEnable - Whether this instance should be enabled. Defaults to true.
     * @param {object} options.backend - The backend object to use as backend. Should expose `getItem`, `getItem` and `removeItem` function. Defaults to `window.localStorage`.
     * @param {object} options.maxAge - Maximum age of data in seconds. Defaults to 0, which means indefinite.
     * @param {boolean} options.autoEnable - Whether to automatically enable the backend. Defaults to true.
     * @param {object} options.publicPath - in case you use multiple apps on the same origin, use this to provide a scope and avoid collisions. Defaults to '/'.
     */
    constructor(name, options) {
        this.name = `[${options.publicPath || DEFAULT_PUBLIC_PATH}]${name}`;
        this.init(options);
        instances.push(this);
    }
    init({ backend = window.localStorage, autoEnable = true, maxAge = 0, data = {}, logging = this.logging } = {}) {
        this.backend = backend;
        this.logging = logging;
        this.defaultData = this.defaultData || { ...data };
        this.data = { ...this.defaultData, ...this.data, ...data };
        this.maxAge = maxAge;

        if (!this.backend.getItem(`${this.name}:disabled`) && autoEnable) {
            const savedData = this.backend.getItem(this.name);
            if (savedData) {
                try {
                    this.data = { ...this.data, ...JSON.parse(savedData) };
                } catch (error) {
                    console.warn('[Persistence] failed parsing saved data', {
                        error,
                        savedData
                    });
                }
            }
            this.enable();
        }
    }

    isExpired() {
        if (this.maxAge && this.data && (this.data.lastWrite || this.data.lastRead)) {
            const lastWrite = Number(this.data.lastWrite);
            const lastRead = Number(this.data.lastRead);
            if (Math.max(lastWrite, lastRead) < Date.now() - this.maxAge * 1000) {
                console.log('session expired');
                return true;
            }
        }
        return false;
    }
    touch() {
        this.lastRead = Date.now();
    }
    /** Sets values given an object with keys and values */
    setState(nextState, autoSave) {
        Object.keys(nextState).forEach(key => {
            this.set(key, nextState[key]);
        });
        if (autoSave) {
            this.save();
        }
    }
    /**
     * Short for setItem(key, value)
     */
    set(key, value, autoSave) {
        return this.setItem(key, value, autoSave);
    }

    /**
     * Short for getItem(key)
     */
    get(key) {
        return this.getItem(key);
    }

    has(key) {
        this.data.hasOwnProperty(key);
    }

    /**
     * Short for removeItem(key)
     */
    remove(key, autoSave) {
        return this.removeItem(key, autoSave);
    }

    /**
     * Retrieves a value from the backendd data.
     * - Booleans, numbers, undefined and null will be parsed/casted to proper JS objects/values
     * - All other values will be returned as strings
     *
     * Note: This does not read from the backend directly, but from the data object instead (which was initially parsed from the backend values)
     *
     * @param {String} key - The key to retrieve a value for
     */
    getItem(key) {
        // this.data.lastRead = Date.now();
        if (key === undefined) {
            this.logging && console.log('get', { key, result: this.data });
            return this.data;
        }
        const getValue = () => {
            const value = this.data[key];
            if (value !== undefined) {
                if (value === 'true' || value === true) {
                    return true;
                }
                if (value === 'false' || value === false) {
                    return false;
                }
                if (value === 'undefined') {
                    return undefined;
                }
                if (value === 'null' || value === null) {
                    return null;
                }
                if (value === '') {
                    return '';
                }
                if (Array.isArray(value)) {
                    // explicitely check for array!
                    // otherwise, an array containing a single numeric value will pass as a number in the next isNaN check
                    // because javascript is an idiot sometimes..: `isNaN(['1']) === false` due to casting/auto-boxing `['1'] -> '1' -> 1 > numeric`
                    return value;
                }
                if (!isNaN(value)) {
                    return Number(value);
                }
                return value || null;
            }
            return value;
        };
        const result = getValue();

        this.logging && console.log('get', { key, result });
        return result;
    }

    /**
     * Sets a key/value to the data object.
     * Does not write to backend automatically!
     *
     * @param {String} key - The key for the value
     * @param {any} value - The value
     * @param {Boolean} autoSave - Whether to write to backend. Defaults to false
     */
    setItem(key, value, autoSave) {
        this.data[key] = value;
        // this.data.lastWrite = Date.now();
        this.logging && console.log('set', key, value);
        if (autoSave === true) {
            this.save();
        }
    }

    /**
     * Deletes a key and its value from the data object.
     * Does not write to this.backend automatically!
     *
     * @param {String} key - The key to delete
     * @param {Boolean} autoSave - Whether to write to backend. Defaults to false
     */
    removeItem(key, autoSave) {
        delete this.data[key];
        this.logging && console.log('remove', key);
        // this.data.lastWrite = Date.now();
        if (autoSave === true) {
            this.save();
        }
    }

    /**
     * Persistently enables this instance: Setters will change values, save will write to the backend, save() will be called before unload.
     */
    enable() {
        this.enabled = true;
        this.backend.removeItem(`${this.name}:disabled`);
        if (this.isExpired()) {
            this.clear();
        }
    }

    /**
     * Persistently disables this instance: The data object will be flushed, setters will not change values anymore, save() will not write to the backend, and it will not be called before unload.
     * To only disable the functionality without flushing the data, pass `false` as argument.
     *
     * The disabled state will be persisted to backend: The instance remains inactive until `enable()` is called, even across browser reload.
     *
     * @param {Boolean} autoClear - Whether to remove the data as well. Defaults to true.
     */
    disable(autoClear = true) {
        if (autoClear) {
            this.clear();
        }
        this.enabled = false;
        this.backend.setItem(`${this.name}:disabled`, true);
    }

    /**
     * Empties the data object and writes it to backend.
     */
    clear() {
        this.logging && console.log('clear', { ...this.data });
        this.data = { ...this.defaultData };
        this.save();
    }

    /**
     * Writes the data object to backend
     */
    save = () => {
        try {
            this.logging && console.log('save', this.name, { ...this.data }, JSON.stringify(this.data));
            const data = JSON.stringify(this.data);
            this.backend.setItem(this.name, data);
        } catch (error) {
            console.warn(error);
        }
    };

    // based on http://stackoverflow.com/a/34245594/368254
    /**
     * Get the size of this storage.
     * Seems to approximate bytes.
     */
    getSize() {
        var sum = 0;
        const keys = Object.keys(this.data);
        const data = this.data;
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            var value = JSON.stringify(data[key]);
            sum += key.length + value.length;
        }
        return sum;
    }
}

export default Persistence;
window.Persistence = Persistence;
