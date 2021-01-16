import * as Knex from 'knex';
import { getAllDbs, getKnexForDb } from './util/knexInstanceProvider';
import { KnexAdapter } from '../lib/adapter';

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
        await knex.schema.dropTable('policies');
        return knex.destroy();
      });

      describe('createTable', () => {
        it('correctly creates tables', async () => {
          await adapter.createTable();
          await assertTableExists(knex, 'policies');
        });
      });
    });
  });
});

async function assertTableExists(knex: Knex, table: string) {
  const tableExists = await knex.schema.hasTable(table);
  expect(tableExists).toBe(true);
}
