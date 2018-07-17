# @loopmode/persistence

A scoped wrapper for web storage APIs.

Allows simplified and more performant usage of `window.localStorage` and `window.sessionStorage`.  
Instead of using long keys to avoid collisions, create scoped persistence objects instead.

Full documentation available at [https://loopmode.github.io/persistence/](https://loopmode.github.io/persistence/).

## Usage

Supports an API similar to the web storage API (`getItem`, `setItem`) with additional `get` and `set` aliases, but under the scope of a specific name. You can use logical and short/similar keys across scopes.
Additionally, you can store object values.

```javascript
// PageOne.js
const storage = new Persistence('PageOne');
storage.set('viewMode', 'list');

// PageTwo.js
const storage = new Persistence('PageTwo');
storage.set('viewMode', 'grid');
storage.set('foo', {bar: {baz: 'boo'}});
```

## Serialization and performance

When using the get/set methods, you are not operating on the actual web storage yet, because that would involve serialization/deserialization (e.g. `JSON.encode`, `JSON.stringify`).  
Instead, you work on a simple in-memory object and no serialization is taking place until before the page is unloaded or you call `instance.save()` manually.  
_NOTE: You can pass the `{autoSave: true}` option to the `set` and `setItem` methods in order to immediatly write to the Storage: backend_

```javascript
// PageTwo.js
storage.set('foo', {bar: {baz: 'boo'}});
// value is immediatly available for reading, even if it's not persisted to the web storage yet
console.log(storage.get('foo').bar); // {baz: 'boo'}
window.localStorage.getItem("PageTwo"); // null

storage.save();
window.localStorage.getItem("PageTwo"); // "{\"viewMode\": \"grid\", \"foo\": {\"bar\": {\"baz\": \"boo\"}}"} 
```

Effectively, you are free to set ridiculous amounts of data without worrying about performance impacts, for example you could set complex data objects within a `mousemove` event handlers or even inside a raf-loop.

## Shared instances

In case you need to access values from different components, e.g. in a react application, when you don't know the order of instantiation, use the the static `connect` method instead of creating an instance.  
It wil simply return an existing instance if found, or create and return one if it's the firt call.

```javascript
var a = Persistence.connect('foo');
var b = Persistence.connect('foo');
console.log(a === b); // true
```

## Storage: backend

Pass the `backend` option to specify where to actually persist the data. The value should be an object that supports the web storage API (`setItem`, `getItem`, `removeItem`).  
The default value is `window.localStorage`.


```javascript
const storage = new Persistence('options', {backend: window.sessionStorage});
```