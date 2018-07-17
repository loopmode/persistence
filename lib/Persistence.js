'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _class, _temp;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var instances = [];

var DEFAULT_PUBLIC_PATH = '/';

if (!window.__persistenceInitialized) {
    window.__persistenceInitialized = true;
    window.addEventListener('beforeunload', function persistAll() {
        instances.forEach(function (instance) {
            if (instance.enabled) {
                try {
                    instance.save();
                } catch (error) {
                    console.warn('[Persistence] Failed saving', {
                        error: error,
                        instance: instance
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
 * The API resembles the one from the web storage objects: `setItem(key, vaue)`, `getItem(key)`, `removeItem(key)`, but there are also shorter aliases: `set()`, `get()` and `remove()`.
 *
 * In order to avoid expensive JSON serialization/deserialization by interacting with the storage backend, the data is held in memory (in a simple object).
 * All operations operate on that plain object. An event listener is registered for the `window.beforeunload` event, and only then we will serialize the data to an actual JSON string.
 * The string is then persisted to the backend storage, e.g. `window.localStorage` (default).
 *
 * @example
 * const myCache = new Persistence('myCache');
 * myCache.setItem('started', new Date());
 * console.log(myCache.getItem('started'));
 *
 * @author jovica.aleksic@xailabs.de
 */
var Persistence = (_temp = _class = function () {
    _createClass(Persistence, null, [{
        key: 'connect',


        /**
         * Returns an already existing instance for a given name or creates a new instance and returns it.
         * Note that all constructor options are supported here as well.
         *
         * @param {Object} [options] - Options object
         * @param {String} [options.publicPath = '/'] - The path where this app is deployed within the current origin
         * @return {Object} - The found or created `Persistence` object
         */
        value: function connect(name) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var instance = Persistence.get('[' + (options.publicPath || DEFAULT_PUBLIC_PATH) + ']' + name);
            if (instance) {
                if (options) {
                    instance.init(options);
                }
                return instance;
            }
            return new Persistence(name, options);
        }

        /* eslint-disable */
        /**
         * Gets a storage by its full name.
         * The full name includes the `publicPath` in order to avoid collisions in cases where multiple apps operate within the same origin.
         *
         * For example, if you created an instance via `new Persistence('foo')`, you could access it via `Persistence.get('[/]foo')`.  
         * On the other hand, you might also have a debuggable version deployed on the same origin at `/dev`. (You'd probably use some kind of config value for `publicPath` in such cases).  
         * So, if you had created the instance via `new Persistence('foo', {publicPath: '/dev'})`, you would access it via `Persistence.get('[/dev]foo')`.
         *
         * _NOTE: If you do not want to deal with full names and `publicPath` values, use `Persistence.find(name)` instead._  
         * _NOTE: If you need to get all instances of the origin, use `Persistence.filter(name)` instead._
         *
         * @see {@link Persistence.find}
         * @see {@link Persistence.filter}
         *
         * @param {String} name - the full instance name
         * @return {Object} - The found `Persistence` object or `undefined`
         */
        /* eslint-enable */

    }, {
        key: 'get',
        value: function get(name) {
            return instances.find(function (storage) {
                return storage.name === name;
            });
        }

        /**
         * Finds a single storage by partial name match.
         *
         * @example
         * const storage = new Persistence('config', {publicPath: '/app-one/dev'});
         * console.log(Persistence.find('conf')) // {logging: false, save: ƒ, name: "[/app-one/dev]config", backend: Storage, defaultData: {…}, …}
         *
         * @param {string|RegExp} name - A string or regular expression that will be matched against instance names
         * @return {Object} - The found `Persistence` object or `undefined`
         */

    }, {
        key: 'find',
        value: function find(name) {
            return instances.find(function (storage) {
                return storage.name.match(name);
            });
        }

        /**
         * Filters all storages by partial name match.
         *
         * @param {string|RegExp} name - A string or regular expression that will be matched against instance names
         * @return {Array} - An array of matching `Persistence` objects. Might be empty.
         */

    }, {
        key: 'filter',
        value: function filter(name) {
            return instances.filter(function (storage) {
                return storage.name.match(name);
            });
        }

        /**
         * Returns an object containing all instances as values.
         * The instance names are used as keys. If you need an array of instances and don't care about their names, use `Object.values(Persistence.getAll())`.
         * @return {Object} - A key/value object where each key is an instance name and each value is an instance.
         */

    }, {
        key: 'getAll',
        value: function getAll() {
            return instances.reduce(function (result, instance) {
                result[instance.name] = instance;
                return result;
            }, {});
        }

        /**
         * Clears all storage instances.
         * @param {Object} [options] - Options object
         * @param {Array} [options.only] - An array of names. If provided, **only** instances whose names match partially will be cleared.
         * @param {Array} [options.not] - An array of names. If provided, instances whose names match partially will **NOT** be cleared.
         */

    }, {
        key: 'clearAll',
        value: function clearAll() {
            var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            var onlyIncluded = function onlyIncluded(instance) {
                return !options.only || options.only.find(function (name) {
                    return instance.name.match(name);
                });
            };
            var notExcluded = function notExcluded(instance) {
                return !options.not || !options.not.find(function (name) {
                    return instance.name.match(name);
                });
            };
            var cleared = instances.filter(onlyIncluded).filter(notExcluded).map(function (storage) {
                storage.clear();
                return storage;
            });
            var skipped = instances.filter(function (instance) {
                return cleared.indexOf(instance) === -1;
            });
            Persistence.logging && console.info('[Persistence]', cleared.length ? '\n\tcleared: ' + cleared.map(function (instance) {
                return instance.name;
            }) : '', skipped.length ? '\n\tskipped: ' + skipped.map(function (instance) {
                return instance.name;
            }) : '');
        }

        /**
         * Retrieves the size of the occupied storage space for all instances.
         * The value is a number of characters and roughly approximates bytes.
         * TODO: proper byte-size conversion
         */

    }, {
        key: 'getSize',
        value: function getSize() {
            return instances.reduce(function (result, storage) {
                return result + storage.getSize();
            }, 0);
        }

        //
        // Instance API
        //
        //--------------------------------------------------------------------

        /**
         * Whether to log details to the console when certain instance methods are called.
         * @type {Boolean}
         */

    }, {
        key: 'instances',


        /**
         * An array containing all instances.
         * _NOTE: This is a read-only value. You can not mutate the actual instances array._
         * @type {Array}
         */
        get: function get() {
            return [].concat(instances);
        }
        //
        // Static API
        //
        //--------------------------------------------------------------------

        /**
         * Whether to log details to the console when certain static methods are called.
         * @type {Boolean}
         */

    }]);

    /* eslint-disable */
    /**
     * Creates a new Persistence object.  
     * A Persistence stores its data in a simple object (in memory) and persists the data as a JSON string to web storage backend (e.g. `window.localStorage`) before the window unloads, using the instance `name` as the actual key in the web storage backend.
     * When a new instance is created, it looks for previously stored data in the web storage backend, and parses it back to a data object for runtime usage.
     *
     * This means that you can set and get values without an performance penalty, JSON conversion only happens at startup and before unload.
     *
     * You can specify a name to enable multiple apps on the same origin without collisions in data using the `publicPath` option.
     * (Consider that localStorage is shared per origin (protocol, host, port), so if you want to have two _instances in /a and /b, you can use those paths as names for the Persistence)
     *
     * @param {String} name - A unique name for this backend object.
     * @param {Object} options -
     * @param {Object} options.data - An initial data object for this instance
     * @param {Object} options.backend - The backend object to use as backend. Should expose `getItem`, `getItem` and `removeItem` function. Defaults to `window.localStorage`.
     * @param {Boolean} options.logging - Whether to enable to logging for this instance
     * @param {Boolean} options.autoEnable - Whether this instance should be enabled. Defaults to true.
     * @param {String} [options.publicPath = '/'] - The path where this app is deployed within the current origin
     */
    /* eslint-enable */
    function Persistence(name) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, Persistence);

        this.logging = false;

        this.name = '[' + (options.publicPath || DEFAULT_PUBLIC_PATH) + ']' + name;
        this.save = this.save.bind(this);
        this.init(options);
        instances.push(this);
    }

    /**
     * @private
     */


    _createClass(Persistence, [{
        key: 'init',
        value: function init() {
            var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
                _ref$backend = _ref.backend,
                backend = _ref$backend === undefined ? window.localStorage : _ref$backend,
                _ref$autoEnable = _ref.autoEnable,
                autoEnable = _ref$autoEnable === undefined ? true : _ref$autoEnable,
                _ref$data = _ref.data,
                data = _ref$data === undefined ? {} : _ref$data,
                _ref$logging = _ref.logging,
                logging = _ref$logging === undefined ? this.logging : _ref$logging;

            this.backend = backend;
            this.logging = logging;
            this.defaultData = this.defaultData || _extends({}, data);
            this.data = _extends({}, this.defaultData, this.data, data);

            if (!this.backend.getItem(this.name + ':disabled') && autoEnable) {
                var savedData = this.backend.getItem(this.name);
                if (savedData) {
                    try {
                        this.data = _extends({}, this.data, JSON.parse(savedData));
                    } catch (error) {
                        console.warn('[Persistence] failed parsing saved data', {
                            error: error,
                            savedData: savedData
                        });
                    }
                }
                this.enable();
            }
        }

        /**
         * Checks if a property exists.
         * Note: `true` will be returned as long as the key is found on the data object, even if the value itself is empty.
         *
         * @param {String} key - The property name to check for existence.
         * @return {Boolean} - `true` if `key` was found
         */

    }, {
        key: 'has',
        value: function has(key) {
            this.data.hasOwnProperty(key);
        }

        /**
         * Alias for `setItem(key, value)`
         * @see {@link Persistence#setItem}
         * @param {String|Object} key - The key for the value
         * @param {any} [value] - When `key` is a string: the value, otherwise: the `autoSave` flag
         * @param {Boolean} [autoSave] - When `key` is a string: Whether to immediatly write to the backend.
         */

    }, {
        key: 'set',
        value: function set(key, value, autoSave) {
            return this.setItem(key, value, autoSave);
        }

        /**
         * Alias for `getItem(key)`
         * @see {@link Persistence#getItem}
         * @param {String} key - The key to retrieve a value for
         * @return {any} - The value for `key`
         */

    }, {
        key: 'get',
        value: function get(key) {
            return this.getItem(key);
        }

        /**
         * Alias for `removeItem(key)`
         * @see {@link Persistence#removeItem}
         * @param {String} key - The key to delete
         * @param {Boolean} autoSave - Whether to write to backend. Defaults to false
         */

    }, {
        key: 'remove',
        value: function remove(key, autoSave) {
            return this.removeItem(key, autoSave);
        }

        /**
         * Retrieves a value from the backend data.
         * - Booleans, numbers, undefined and null will be parsed/casted to proper JS objects/values
         * - All other values will be returned as strings
         *
         * Note: This does not read from the backend directly, but from the data object instead (which was initially parsed from the backend values)
         *
         * @param {String} key - The key to retrieve a value for
         * @return {any} - The value for `key`
         */

    }, {
        key: 'getItem',
        value: function getItem(key) {
            var _this = this;

            if (key === undefined) {
                this.logging && console.log('get', { key: key, result: this.data });
                return this.data;
            }
            var getValue = function getValue() {
                var value = _this.data[key];
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
            var result = getValue();

            this.logging && console.log('get', { key: key, result: result });
            return result;
        }

        /**
         * Sets a key/value to the data object.
         * If the first argument is not a string but an object, the signature changes to `(values, autoSave)` and `setAll` will be used internally.
         *
         * @param {String|Object} key - The key for the value
         * @param {any} [value] - When `key` is a string: the value, otherwise: the `autoSave` flag
         * @param {Boolean} [autoSave] - When `key` is a string: Whether to immediatly write to the backend.
         */

    }, {
        key: 'setItem',
        value: function setItem(key, value, autoSave) {
            if (typeof key !== 'string') {
                return this.setAll(key, value);
            }
            this.data[key] = value;
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

    }, {
        key: 'removeItem',
        value: function removeItem(key, autoSave) {
            delete this.data[key];
            this.logging && console.log('remove', key);
            if (autoSave === true) {
                this.save();
            }
        }

        /**
         * Sets all values of a given object at once.
         * Calls `set(key, value)` for each key of the object.
         *
         * @param {Object} values - An object with keys and values
         * @param {Boolean} autoSave - Whether to write to the storage backend right away.
         */

    }, {
        key: 'setAll',
        value: function setAll(values, autoSave) {
            var _this2 = this;

            Object.keys(values).forEach(function (key) {
                _this2.set(key, values[key]);
            });
            if (autoSave) {
                this.save();
            }
        }

        /**
         * Persistently enables this instance.
         * Setters will change values, save will write to the backend, save() will be called before unload.
         */

    }, {
        key: 'enable',
        value: function enable() {
            this.enabled = true;
            this.backend.removeItem(this.name + ':disabled');
        }

        /**
         * Persistently disables this instance.
         * The data object will be cleared, setters will not change values anymore, save() will not write to the backend, and it will not be called before unload.
         * To only disable the functionality without flushing the data, pass `false` as argument.
         *
         * The disabled state will be persisted to backend: The instance remains inactive until `enable()` is called, even across browser reload.
         *
         * @param {Boolean} autoClear - Whether to remove the data as well. Defaults to true.
         */

    }, {
        key: 'disable',
        value: function disable() {
            var autoClear = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            if (autoClear) {
                this.clear();
            }
            this.enabled = false;
            this.backend.setItem(this.name + ':disabled', true);
        }

        /**
         * Empties the data object and the persisted backend values.
         */

    }, {
        key: 'clear',
        value: function clear() {
            this.logging && console.log('clear', _extends({}, this.data));
            this.data = _extends({}, this.defaultData);
            this.save();
        }

        /**
         * Writes the data object to backend
         */

    }, {
        key: 'save',
        value: function save() {
            try {
                this.logging && console.log('save', this.name, _extends({}, this.data), JSON.stringify(this.data));
                var data = JSON.stringify(this.data);
                this.backend.setItem(this.name, data);
            } catch (error) {
                console.warn(error);
            }
        }

        /**
         * Gets the size of this storage.
         * Seems to approximate bytes.
         * @see http://stackoverflow.com/a/34245594/368254
         * @return {number} - The number of characters used to store the stringified data.
         */

    }, {
        key: 'getSize',
        value: function getSize() {
            var sum = 0;
            var keys = Object.keys(this.data);
            var data = this.data;
            for (var i = 0; i < keys.length; ++i) {
                var key = keys[i];
                var value = JSON.stringify(data[key]);
                sum += key.length + value.length;
            }
            return sum;
        }
    }]);

    return Persistence;
}(), _class.logging = false, _temp);
exports.default = Persistence;

window.Persistence = Persistence;