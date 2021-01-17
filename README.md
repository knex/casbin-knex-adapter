# Knex Adapter

[![NPM Version][npm-image]][npm-url]
![](https://github.com/knex/casbin-knex-adapter/workflows/ci/badge.svg)
[![Coverage Status](https://coveralls.io/repos/knex/casbin-knex-adapter/badge.svg?branch=master)](https://coveralls.io/r/knex/casbin-knex-adapter?branch=master)

[Knex](https://github.com/knex/knex) Adapter for [Node-Casbin](https://github.com/casbin/node-casbin). Use this library for [policy storage](https://casbin.org/docs/en/adapters) in Casbin.

For full database support list, go to the Knex [documentation](https://knexjs.org/#Installation-node).

## Installation

`npm install casbin-knex-adapter --save`

or

`yarn add casbin-knex-adapter`

## Example

```js
const Knex = require('knex')
const casbin = require('casbin');
const KnexAdapter = require('casbin-knex-adapter');

(async function() {
  // Instantiate DB connection
  const knex = Knex(knexOptions)
  // Create adapter
  const adapter = await KnexAdapter.newAdapter({ knex });

  // Create casbin enforcer
  const enforcer = await casbin.newEnforcer('model.conf', adapter);

  // Load policy from DB
  await enforcer.loadPolicy();

  // Check permission
  if (await enforcer.enforce('user', 'resource', 'read')) {
    // Do something if user is authorized
  }

  // Modify policy
  // await enforcer.addPolicy(...)
  // await enforcer.removePolicy(...)

  // Rewrite entire policy in DB
  await enforcer.savePolicy();
})();
```

[npm-image]: https://img.shields.io/npm/v/casbin-knex-adapter.svg
[npm-url]: https://npmjs.org/package/casbin-knex-adapter
