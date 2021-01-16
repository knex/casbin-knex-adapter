// ToDo implement types
// @ts-nocheck

const Knex = require('knex');
const { Helper } = require('casbin');

export class KnexAdapter {
  constructor(knex, tableName = 'policies') {
    this.knex = knex;
    this.tableName = tableName;
  }

  static async newAdapter(arg) {
    const knex = this.isKnex(arg) ? arg : Knex(arg);

    const adapter = new KnexAdapter(knex);
    await adapter.createTable();

    return adapter;
  }

  static isKnex(arg) {
    return typeof arg === 'function';
  }

  get policies() {
    return knex('policies');
  }

  async createTable() {
    const tableExists = await this.knex.schema.hasTable(this.tableName);
    if (!tableExists) {
      await this.knex.schema.createTable(this.tableName, (table) => {
        table.increments('id').primary();
        table.string('ptype').nullable();
        table.string('v0').nullable();
        table.string('v1').nullable();
        table.string('v2').nullable();
        table.string('v3').nullable();
        table.string('v4').nullable();
        table.string('v5').nullable();
      });
    }
  }

  async dropTable() {
    await this.knex.schema.dropTableIfExists(this.tableName);
  }

  async close() {
    await this.knex.destroy();
  }

  createPolicy(ptype, rule) {
    return {
      ptype,
      v0: rule[0],
      v1: rule[1],
      v2: rule[2],
      v3: rule[3],
      v4: rule[4],
      v5: rule[5],
    };
  }

  createFilteredPolicy(ptype, fieldIndex, ...fieldValues) {
    const filteredPolicy = {};

    filteredPolicy.ptype = ptype;

    if (fieldIndex <= 0 && 0 < fieldIndex + fieldValues.length) {
      filteredPolicy.v0 = fieldValues[0 - fieldIndex];
    }
    if (fieldIndex <= 1 && 1 < fieldIndex + fieldValues.length) {
      filteredPolicy.v1 = fieldValues[1 - fieldIndex];
    }
    if (fieldIndex <= 2 && 2 < fieldIndex + fieldValues.length) {
      filteredPolicy.v2 = fieldValues[2 - fieldIndex];
    }
    if (fieldIndex <= 3 && 3 < fieldIndex + fieldValues.length) {
      filteredPolicy.v3 = fieldValues[3 - fieldIndex];
    }
    if (fieldIndex <= 4 && 4 < fieldIndex + fieldValues.length) {
      filteredPolicy.v4 = fieldValues[4 - fieldIndex];
    }
    if (fieldIndex <= 5 && 5 < fieldIndex + fieldValues.length) {
      filteredPolicy.v5 = fieldValues[5 - fieldIndex];
    }

    return filteredPolicy;
  }

  createPoliciesFromAstMap(astMap) {
    const policies = [];
    for (const [ptype, ast] of astMap) {
      for (const rule of ast.policy) {
        policies.push(this.createPolicy(ptype, rule));
      }
    }
    return policies;
  }

  loadPolicyLine(policy, model) {
    const policyLine =
      policy.ptype +
      ', ' +
      [policy.v0, policy.v1, policy.v2, policy.v3, policy.v4, policy.v5]
        .filter((v) => v)
        .join(', ');

    Helper.loadPolicyLine(policyLine, model);
  }

  async loadPolicy(model) {
    const policies = await this.policies.select();

    for (const policy of policies) {
      this.loadPolicyLine(policy, model);
    }
  }

  async savePolicy(model) {
    await this.dropTable();
    await this.createTable();

    await this.policies.insert([
      ...this.createPoliciesFromAstMap(model.model.get('p')),
      ...this.createPoliciesFromAstMap(model.model.get('g')),
    ]);
  }

  async addPolicy(sec, ...args) {
    const policy = this.createPolicy(...args);
    await this.policies.insert(policy);
  }

  async removePolicy(sec, ...args) {
    const policy = this.createPolicy(...args);
    await this.policies.delete().where(policy);
  }

  async removeFilteredPolicy(sec, ...args) {
    const filteredPolicy = this.createFilteredPolicy(...args);
    await this.policies.delete().where(filteredPolicy);
  }
}
