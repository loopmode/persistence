"use strict";

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
    window.addEventListener("beforeunload", function persistAll() {
        instances.forEach(function (instance) {
            if (instance.enabled) {
                try {
                    instance.save();
                } catch (error) {
                    console.warn("[Persistence] Failed saving", {
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
var Persistence = (_temp = _class = function () {
    _createClass(Persistence, null, [{
        key: "connect",


        /**
         * Returns an already existing instance for a given name or creates a new one
         */
        value: function connect(name, options) {
            var instance = Persistence.get("[" + (options.publicPath || DEFAULT_PUBLIC_PATH) + "]" + name);
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

    }, {
        key: "get",
        value: function get(name) {
            return instances.find(function (storage) {
                return storage.name === name;
            });
        }
        /**
         * Finds a store by partial name match
         */

    }, {
        key: "find",
        value: function find(name) {
            return instances.find(function (storage) {
                return storage.name.match(name);
            });
        }
        /**
         * Returns an array containing all instances
         */

    }, {
        key: "getAll",
        value: function getAll() {
            return instances.reduce(function (result, instance) {
                result[instance.name] = instance;
                return result;
            }, {});
        }
        /**
         * Clears all storages
         */

    }, {
        key: "clearAll",
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
            Persistence.logging && console.info("[Persistence]", cleared.length ? "\n\tcleared: " + cleared.map(function (instance) {
                return instance.name;
            }) : "", skipped.length ? "\n\tskipped: " + skipped.map(function (instance) {
                return instance.name;
            }) : "");
        }
        /**
         * Retrieves the size of the occupied space in storage, of all instances.
         * Seems to approximate bytes.
         */

    }, {
        key: "getSize",
        value: function getSize() {
            return instances.reduce(function (result, storage) {
                return result + storage.getSize();
            }, 0);
        }

        //
        // Instance API
        //
        //--------------------------------------------------------------------

    }, {
        key: "instances",
        get: function get() {
            return [].concat(instances);
        }
        //
        // Static API
        //
        //--------------------------------------------------------------------

    }]);

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
    function Persistence(name, options) {
        var _this = this;

        _classCallCheck(this, Persistence);

        this.logging = false;

        this.save = function () {
            try {
                _this.logging && console.log("save", _this.name, _extends({}, _this.data), JSON.stringify(_this.data));
                var data = JSON.stringify(_this.data);
                _this.backend.setItem(_this.name, data);
            } catch (error) {
                console.warn(error);
            }
        };

        this.name = "[" + CONFIG.publicPath + "]" + name;
        this.init(options);
        instances.push(this);
    }

    _createClass(Persistence, [{
        key: "init",
        value: function init() {
            var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
                _ref$backend = _ref.backend,
                backend = _ref$backend === undefined ? window.localStorage : _ref$backend,
                _ref$autoEnable = _ref.autoEnable,
                autoEnable = _ref$autoEnable === undefined ? true : _ref$autoEnable,
                _ref$maxAge = _ref.maxAge,
                maxAge = _ref$maxAge === undefined ? 0 : _ref$maxAge,
                _ref$data = _ref.data,
                data = _ref$data === undefined ? {} : _ref$data,
                _ref$logging = _ref.logging,
                logging = _ref$logging === undefined ? this.logging : _ref$logging;

            this.backend = backend;
            this.logging = logging;
            this.defaultData = this.defaultData || _extends({}, data);
            this.data = _extends({}, this.defaultData, this.data, data);
            this.maxAge = maxAge;

            if (!this.backend.getItem(this.name + ":disabled") && autoEnable) {
                var savedData = this.backend.getItem(this.name);
                if (savedData) {
                    try {
                        this.data = _extends({}, this.data, JSON.parse(savedData));
                    } catch (error) {
                        console.warn("[Persistence] failed parsing saved data", {
                            error: error,
                            savedData: savedData
                        });
                    }
                }
                this.enable();
            }
        }
    }, {
        key: "isExpired",
        value: function isExpired() {
            if (this.maxAge && this.data && (this.data.lastWrite || this.data.lastRead)) {
                var lastWrite = Number(this.data.lastWrite);
                var lastRead = Number(this.data.lastRead);
                if (Math.max(lastWrite, lastRead) < Date.now() - this.maxAge * 1000) {
                    console.log("session expired");
                    return true;
                }
            }
            return false;
        }
    }, {
        key: "touch",
        value: function touch() {
            this.lastRead = Date.now();
        }
        /** Sets values given an object with keys and values */

    }, {
        key: "setState",
        value: function setState(nextState, autoSave) {
            var _this2 = this;

            Object.keys(nextState).forEach(function (key) {
                _this2.set(key, nextState[key]);
            });
            if (autoSave) {
                this.save();
            }
        }
        /**
         * Short for setItem(key, value)
         */

    }, {
        key: "set",
        value: function set(key, value, autoSave) {
            return this.setItem(key, value, autoSave);
        }

        /**
         * Short for getItem(key)
         */

    }, {
        key: "get",
        value: function get(key) {
            return this.getItem(key);
        }
    }, {
        key: "has",
        value: function has(key) {
            this.data.hasOwnProperty(key);
        }

        /**
         * Short for removeItem(key)
         */

    }, {
        key: "remove",
        value: function remove(key, autoSave) {
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

    }, {
        key: "getItem",
        value: function getItem(key) {
            var _this3 = this;

            // this.data.lastRead = Date.now();
            if (key === undefined) {
                this.logging && console.log("get", { key: key, result: this.data });
                return this.data;
            }
            var getValue = function getValue() {
                var value = _this3.data[key];
                if (value !== undefined) {
                    if (value === "true" || value === true) {
                        return true;
                    }
                    if (value === "false" || value === false) {
                        return false;
                    }
                    if (value === "undefined") {
                        return undefined;
                    }
                    if (value === "null" || value === null) {
                        return null;
                    }
                    if (value === "") {
                        return "";
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

            this.logging && console.log("get", { key: key, result: result });
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

    }, {
        key: "setItem",
        value: function setItem(key, value, autoSave) {
            this.data[key] = value;
            // this.data.lastWrite = Date.now();
            this.logging && console.log("set", key, value);
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
        key: "removeItem",
        value: function removeItem(key, autoSave) {
            delete this.data[key];
            this.logging && console.log("remove", key);
            // this.data.lastWrite = Date.now();
            if (autoSave === true) {
                this.save();
            }
        }

        /**
         * Persistently enables this instance: Setters will change values, save will write to the backend, save() will be called before unload.
         */

    }, {
        key: "enable",
        value: function enable() {
            this.enabled = true;
            this.backend.removeItem(this.name + ":disabled");
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

    }, {
        key: "disable",
        value: function disable() {
            var autoClear = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            if (autoClear) {
                this.clear();
            }
            this.enabled = false;
            this.backend.setItem(this.name + ":disabled", true);
        }

        /**
         * Empties the data object and writes it to backend.
         */

    }, {
        key: "clear",
        value: function clear() {
            this.logging && console.log("clear", _extends({}, this.data));
            this.data = _extends({}, this.defaultData);
            this.save();
        }

        /**
         * Writes the data object to backend
         */

    }, {
        key: "getSize",


        // based on http://stackoverflow.com/a/34245594/368254
        /**
         * Get the size of this storage.
         * Seems to approximate bytes.
         */
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