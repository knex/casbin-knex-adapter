import * as Knex from 'knex';
import { getAllDbs, getKnexForDb } from './util/knexInstanceProvider';
import { KnexAdapter } from '../lib/adapter';
import { Model, newEnforcer } from 'casbin';
import { resolve } from 'path';
import { expectAuthorized, expectNotAuthorized } from './util/assertUtils';

describe('adapter', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex: Knex;
      let adapter: KnexAdapter;
      beforeEach(() => {
        knex = getKnexForDb(db);
        adapter = new KnexAdapter(knex);
      });

      afterEach(async () => {
        await knex.schema.dropTableIfExists('policies');
        return adapter.close();
      });

      describe('newAdapter', () => {
        it('correctly creates adapter', async () => {
          await KnexAdapter.newAdapter(knex);
          const tableExists = await knex.schema.hasTable('policies');
          expect(tableExists).toBe(true);
        });
      });

      describe('createTable', () => {
        it('correctly creates table', async () => {
          await adapter.createTable();
          const tableExists = await knex.schema.hasTable('policies');
          expect(tableExists).toBe(true);
        });
      });

      describe('newAdapter', () => {
        it('correctly creates table', async () => {
          adapter = await KnexAdapter.newAdapter(knex);
          const tableExists = await knex.schema.hasTable('policies');
          expect(tableExists).toBe(true);
        });
      });

      describe('dropTable', () => {
        it('correctly drops table', async () => {
          await adapter.createTable();
          await adapter.dropTable();
          const tableExists = await knex.schema.hasTable('policies');
          expect(tableExists).toBe(false);
        });
      });

      describe('savePolicy', () => {
        it('returns true when saving was successful', async () => {
          await adapter.createTable();
          const model = new Model();
          model.loadModel(resolve(__dirname, 'model-4.conf'));
          model.addPolicy('p', 'p', [
            'authorizedUser',
            'resource',
            '1',
            'read',
          ]);

          const result = await adapter.savePolicy(model);

          expect(result).toBe(true);
        });

        it('returns false when saving was not successful', async () => {
          const result = await adapter.savePolicy((null as unknown) as Model);

          expect(result).toBe(false);
        });
      });

      describe('addPolicy', () => {
        it('supports adding policy via enforcer', async () => {
          await adapter.createTable();

          const enforcer = await newEnforcer(
            resolve(__dirname, 'model.conf'),
            adapter
          );
          await enforcer.loadPolicy();
          await enforcer.addPolicy('authorizedUser', 'resource', 'read');

          const adapter2 = new KnexAdapter(knex);
          const enforcer2 = await newEnforcer(
            resolve(__dirname, 'model.conf'),
            adapter2
          );
          await enforcer2.loadPolicy();

          await expectAuthorized(
            enforcer2,
            'authorizedUser',
            'resource',
            'read'
          );
          await expectAuthorized(
            enforcer,
            'authorizedUser',
            'resource',
            'read'
          );
          await expectNotAuthorized(
            enforcer2,
            'authorizedUser',
            'resource',
            'write'
          );
          await expectNotAuthorized(
            enforcer2,
            'authorizedUser',
            'resource2',
            'read'
          );
          await expectNotAuthorized(
            enforcer2,
            'unauthorizedUser',
            'resource',
            'read'
          );
        });

        it('supports adding policy directly through adapter', async () => {
          const model = new Model();
          model.loadModel(resolve(__dirname, 'model-4.conf'));

          await adapter.createTable();
          await adapter.addPolicy('p', 'p', [
            'authorizedUser',
            'resource',
            '1',
            'read',
          ]);

          const enforcer = await newEnforcer(model, adapter);
          await enforcer.loadPolicy();

          await expectAuthorized(
            enforcer,
            'authorizedUser',
            'resource',
            '1',
            'read'
          );
          await expectNotAuthorized(
            enforcer,
            'authorizedUser',
            'resource',
            '2',
            'read'
          );
          await expectNotAuthorized(
            enforcer,
            'authorizedUser',
            'resource',
            '2',
            'write'
          );
          await expectNotAuthorized(
            enforcer,
            'authorizedUser',
            'resource2',
            '1',
            'read'
          );
          await expectNotAuthorized(
            enforcer,
            'unauthorizedUser',
            'resource',
            '1',
            'read'
          );
        });
      });

      describe('addPolicies', () => {
        it('supports adding policies via enforcer', async () => {
          await adapter.createTable();

          const enforcer = await newEnforcer(
            resolve(__dirname, 'model.conf'),
            adapter
          );
          await enforcer.loadPolicy();
          await enforcer.addPolicies([
            ['authorizedUser', 'resource', 'read'],
            ['authorizedUser', 'resource', 'write'],
          ]);

          const adapter2 = new KnexAdapter(knex);
          const enforcer2 = await newEnforcer(
            resolve(__dirname, 'model.conf'),
            adapter2
          );
          await enforcer2.loadPolicy();

          if (
            !(await enforcer2.enforce('authorizedUser', 'resource', 'read'))
          ) {
            throw new Error('User is not authorized');
          }

          if (!(await enforcer.enforce('authorizedUser', 'resource', 'read'))) {
            throw new Error('User is not authorized');
          }

          if (
            !(await enforcer2.enforce('authorizedUser', 'resource', 'write'))
          ) {
            throw new Error('User is not authorized');
          }

          if (
            !(await enforcer.enforce('authorizedUser', 'resource', 'write'))
          ) {
            throw new Error('User is not authorized');
          }

          if (await enforcer2.enforce('authorizedUser', 'resource2', 'read')) {
            throw new Error('User is not authorized');
          }

          if (await enforcer2.enforce('unauthorizedUser', 'resource', 'read')) {
            throw new Error('User is authorized');
          }
        });

        it('supports adding policy directly through adapter', async () => {
          const model = new Model();
          model.loadModel(resolve(__dirname, 'model-4.conf'));

          await adapter.createTable();
          await adapter.addPolicies('p', 'p', [
            ['authorizedUser', 'resource', '1', 'read'],
            ['authorizedUser', 'resource', '1', 'write'],
          ]);

          const enforcer = await newEnforcer(model, adapter);
          await enforcer.loadPolicy();

          if (
            !(await enforcer.enforce('authorizedUser', 'resource', '1', 'read'))
          ) {
            throw new Error('User is not authorized');
          }

          if (
            !(await enforcer.enforce(
              'authorizedUser',
              'resource',
              '1',
              'write'
            ))
          ) {
            throw new Error('User is not authorized');
          }

          if (
            await enforcer.enforce('authorizedUser', 'resource', '2', 'read')
          ) {
            throw new Error('User is authorized');
          }

          if (
            await enforcer.enforce('authorizedUser', 'resource2', '1', 'read')
          ) {
            throw new Error('User is not authorized');
          }

          if (
            await enforcer.enforce('unauthorizedUser', 'resource', '1', 'read')
          ) {
            throw new Error('User is authorized');
          }
        });
      });

      describe('removePolicy', () => {
        it('supports deleting policy via enforcer', async () => {
          await adapter.createTable();

          const enforcer = await newEnforcer(
            resolve(__dirname, 'model.conf'),
            adapter
          );
          await enforcer.loadPolicy();
          await enforcer.addPolicy('authorizedUser', 'resource', 'read');

          // Removing policy via adapter also removes it in adapter
          await enforcer.removePolicy('authorizedUser', 'resource', 'read');

          const enforcer2 = await newEnforcer(
            resolve(__dirname, 'model.conf'),
            adapter
          );
          await enforcer2.loadPolicy();

          if (await enforcer.enforce('authorizedUser', 'resource', 'read')) {
            throw new Error('User is authorized');
          }

          if (await enforcer2.enforce('authorizedUser', 'resource', 'read')) {
            throw new Error('User is authorized');
          }
        });

        it('supports deleting policy directly through adapter', async () => {
          const model = new Model();
          model.loadModel(resolve(__dirname, 'model-4.conf'));

          await adapter.createTable();
          await adapter.addPolicy('p', 'p', [
            'authorizedUser',
            'resource',
            '1',
            'read',
          ]);
          const enforcer = await newEnforcer(model, adapter);
          await enforcer.loadPolicy();

          await adapter.removePolicy('p', 'p', [
            'authorizedUser',
            'resource',
            '1',
            'read',
          ]);

          // We need to reload policy for enforcer to catch changes in adapter
          await enforcer.loadPolicy();

          if (
            await enforcer.enforce('authorizedUser', 'resource', '1', 'read')
          ) {
            throw new Error('User is authorized');
          }
        });
      });

      describe('removePolicies', () => {
        it('supports deleting policies via enforcer', async () => {
          await adapter.createTable();

          const enforcer = await newEnforcer(
            resolve(__dirname, 'model.conf'),
            adapter
          );
          await enforcer.loadPolicy();
          await enforcer.addPolicy('authorizedUser', 'resource', 'read');
          await enforcer.addPolicy('authorizedUser2', 'resource', 'read');
          await enforcer.addPolicy('authorizedUser3', 'resource', 'read');

          // Removing policy via adapter also removes it in adapter
          await enforcer.removePolicies([
            ['authorizedUser', 'resource', 'read'],
            ['authorizedUser2', 'resource', 'read'],
          ]);

          const enforcer2 = await newEnforcer(
            resolve(__dirname, 'model.conf'),
            adapter
          );
          await enforcer2.loadPolicy();

          await expectNotAuthorized(
            enforcer,
            'authorizedUser',
            'resource',
            'read'
          );
          await expectNotAuthorized(
            enforcer,
            'authorizedUser2',
            'resource',
            'read'
          );
          await expectAuthorized(
            enforcer,
            'authorizedUser3',
            'resource',
            'read'
          );
          await expectNotAuthorized(
            enforcer2,
            'authorizedUser',
            'resource',
            'read'
          );
          await expectNotAuthorized(
            enforcer2,
            'authorizedUser2',
            'resource',
            'read'
          );
          await expectAuthorized(
            enforcer2,
            'authorizedUser3',
            'resource',
            'read'
          );
        });

        it('supports deleting policies directly through adapter', async () => {
          const model = new Model();
          model.loadModel(resolve(__dirname, 'model.conf'));

          await adapter.createTable();
          await adapter.addPolicies('p', 'p', [
            ['authorizedUser', 'resource', 'read'],
            ['authorizedUser2', 'resource', 'read'],
            ['authorizedUser3', 'resource', 'read'],
          ]);

          const enforcer = await newEnforcer(model, adapter);
          await enforcer.loadPolicy();

          await adapter.removePolicies('p', 'p', [
            ['authorizedUser', 'resource', 'read'],
            ['authorizedUser2', 'resource', 'read'],
          ]);

          // We need to reload policy for enforcer to catch changes in adapter
          await enforcer.loadPolicy();

          await expectNotAuthorized(
            enforcer,
            'authorizedUser',
            'resource',
            'read'
          );
          await expectNotAuthorized(
            enforcer,
            'authorizedUser2',
            'resource',
            'read'
          );
          await expectAuthorized(
            enforcer,
            'authorizedUser3',
            'resource',
            'read'
          );
        });
      });
    });
  });
});
