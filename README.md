# Knex Adapter

[Knex](https://github.com/tgriesser/knex) Adapter for [Node-Casbin](). Use this library for [policy storage](https://casbin.org/docs/en/adapters) in Casbin.

For full database support list, go to the Knex [documentation](https://knexjs.org/#Installation-node).

**WARNING: This adapter has only been tested manually. It lacks automated tests, which will show up when I'll have time. If you want to use it in production - be careful.**

## Installation

`npm install casbin-knex-adapter --save`

or

`yarn add casbin-knex-adapter`

## Example

```js
const casbin = require('casbin');
const KnexAdapter = require('casbin-knex-adapter');

(async function() {
  // Create adapter
  const adapter = await KnexAdapter.newAdapter(knexOptions);
  // or pass a Knex instance
  // const adapter = await KnexAdapter.newAdapter(knexInstance);

  // Create casbin enforcer
  const enforcer = await casbin.newEnforcer('model.conf', adapter);

  // Load policy from DB
  await enforcer.loadPolicy();

  // Check permission
  if (enforcer.eforce('user', 'resource', 'read')) {
    // Do something
  }

  // Modify policy
  // await enforcer.addPolicy(...)
  // await enforcer.removePolicy(...)

  // Save policy to DB
  await enforcer.savePolicy();
})();
```
