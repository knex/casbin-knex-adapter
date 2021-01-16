import * as Knex from 'knex';
import { getAllDbs, getKnexForDb } from './util/knexInstanceProvider';
import { KnexAdapter } from '../lib/adapter';
import { Model, newEnforcer } from 'casbin';
import { resolve } from 'path';

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

      describe('casbin support', () => {
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

          if (
            !(await enforcer2.enforce('authorizedUser', 'resource', 'read'))
          ) {
            throw new Error('User is not authorized');
          }

          if (await enforcer2.enforce('authorizedUser', 'resource', 'write')) {
            throw new Error('User is authorized');
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
          await adapter.addPolicy('str', 'p', [
            'authorizedUser',
            'resource',
            '1',
            'read',
          ]);

          const enforcer = await newEnforcer(model, adapter);
          await enforcer.loadPolicy();

          if (
            !(await enforcer.enforce('authorizedUser', 'resource', '1', 'read'))
          ) {
            throw new Error('User is not authorized');
          }

          if (
            await enforcer.enforce('authorizedUser', 'resource', '2', 'read')
          ) {
            throw new Error('User is authorized');
          }

          if (
            await enforcer.enforce('authorizedUser', 'resource', '1', 'write')
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
    });
  });
});