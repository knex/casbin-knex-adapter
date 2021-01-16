# Knex Adapter

[Knex](https://github.com/knex/knex) Adapter for [Node-Casbin](). Use this library for [policy storage](https://casbin.org/docs/en/adapters) in Casbin.

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
  const adapter = await KnexAdapter.newAdapter(knex);

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
