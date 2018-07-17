# @loopmode/persistence

A scoped wrapper for web storage APIs.

- Allows simplified and more performant usage of `window.localStorage` and `window.sessionStorage`.  
- Instead of using complex keys to avoid naming collisions, create scoped persistence objects and use simple keys
- Instead of serializing/deserializing object values on each access, do it only once and operate on a plain object in memory

### Resources

- Full documentation: [https://loopmode.github.io/persistence/](https://loopmode.github.io/persistence/)  
- Github repository: [https://github.com/loopmode/persistence](https://github.com/loopmode/persistence)  
- NPM package: [https://www.npmjs.com/package/@loopmode/persistence](https://www.npmjs.com/package/@loopmode/persistence)  

## Installation

```javascript
yarn add @loopmode/persistence
```

## Usage

Supports an API similar to the web storage API (`getItem`, `setItem`) with additional `get` and `set` aliases, but under the scope of a specific name. You can use logical and short/similar keys across scopes.
Additionally, you can store object values.

```javascript
// PageOne.js
import Persistence from '@loopmode/persistence';
const storage = new Persistence('PageOne');

storage.set('viewMode', 'list');

// PageTwo.js
import Persistence from '@loopmode/persistence';
const storage = new Persistence('PageTwo');

storage.set('viewMode', 'grid');
storage.set('foo', {bar: {baz: 'boo'}});
console.log(storage.get('foo')); // {bar: {baz: 'boo'}}

// you can also pass objects to set all values at once
storage.set({foo: 'foo', bar: {baz: 'boo'}});
console.log(storage.get('foo')); // 'foo'
console.log(storage.get('bar')); // {baz: 'boo'}
```

## Serialization and performance

When using the get/set methods, you are not operating on the actual web storage yet, because that would involve serialization/deserialization (e.g. `JSON.encode`, `JSON.stringify`).  
Instead, you work on a simple in-memory object and no serialization is taking place until before the page is unloaded or you call `instance.save()` manually.

_NOTE: Most mutating methods (`set`/`setItem`, `remove`/`removeItem`, `setItemValues`) support an optional `autoSave` flag. Passing `true` will cause the changes to be immediatly persisted to the web storage backend. The `clear` and `clearAll` methods are an exception to that rule as they are always immediatly persisted._

```javascript
// PageTwo.js
storage.set('foo', {bar: {baz: 'boo'}});
// value is immediatly available for reading, even if it's not persisted to the web storage yet
console.log(storage.get('foo').bar); // {baz: 'boo'}
window.localStorage.getItem("PageTwo"); // null

storage.save();
window.localStorage.getItem("PageTwo"); // "{\"viewMode\": \"grid\", \"foo\": {\"bar\": {\"baz\": \"boo\"}}"} 
```

Effectively, you are free to set ridiculous amounts of data without worrying about performance impacts, for example you could set complex data object values from inside a `mousemove` event handler or set values from inside a `requestAnimationFrame` loop without the penalties of serialization.

## Shared instances

In case you need to access values from different components, e.g. in a react application, when you don't know the order of instantiation, use the the static `connect` method instead of creating an instance.  
The first call will create and return an instance, all consecutive calls (e.g. in other parts of your code) will simply receive the existing instance.

```javascript
var a = Persistence.connect('foo');
var b = Persistence.connect('foo');
console.log(a === b); // true

// also:
var a = new Persistence('foo');
var b = Persistence.connect('foo');
var c = Persistence.connect('foo');
console.log(a === b === c); // true

```

## Storage: backend

Pass the `backend` option to specify where to actually persist the data. The value should be an object that supports the web storage API (`setItem`, `getItem`, `removeItem`).  
The default value is `window.localStorage`.


```javascript
const storage = new Persistence('options', {backend: window.sessionStorage});
```