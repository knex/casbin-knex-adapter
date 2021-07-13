import type Knex from 'knex';
import { getAllDbs, getKnexForDb } from './util/knexInstanceProvider';
import { KnexAdapter } from '../lib/adapter';
import { Model, newEnforcer } from 'casbin';
import { resolve } from 'path';

describe('adapter with a custom tablelName', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex: Knex;
      let adapter: KnexAdapter;
      beforeEach(() => {
        knex = getKnexForDb(db);
        adapter = new KnexAdapter(knex, {
          tableName: 'casbin',
        });
      });

      afterEach(async () => {
        await knex.schema.dropTableIfExists('casbin');
        return adapter.close();
      });

      describe('newAdapter', () => {
        it('correctly creates adapter', async () => {
          await KnexAdapter.newAdapter(knex);
          const tableExists = await knex.schema.hasTable('casbin');
          expect(tableExists).toBe(true);
        });
      });

      describe('createTable', () => {
        it('correctly creates table', async () => {
          await adapter.createTable();
          const tableExists = await knex.schema.hasTable('casbin');
          const wrongTableExists = await knex.schema.hasTable('policies');
          expect(tableExists).toBe(true);
          expect(wrongTableExists).toBe(false);
        });
      });

      describe('dropTable', () => {
        it('correctly drops table', async () => {
          await adapter.createTable();
          await adapter.dropTable();
          const tableExists = await knex.schema.hasTable('casbin');
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
    });
  });
});
