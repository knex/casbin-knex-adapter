const KnexAdapter = require('./adapter.js');
const knex = require('knex');
const mockKnex = require('mock-knex');
const tracker = mockKnex.getTracker();

function createMockPolicy(policyValues, roleValues) {
  // Don't alter passed values
  policyValues = [...policyValues];
  roleValues = [...roleValues];
  // Fill in missing values: v0 - v5
  for (let index = 0; index < 6; index++) {
    if (typeof policyValues[index] === 'undefined') {
      policyValues[index] = null;
    }

    if (typeof roleValues[index] === 'undefined') {
      roleValues[index] = null;
    }
  }

  return {
    model: new Map([
      [
        'p',
        new Map([
          [
            'p',
            {
              policy: [policyValues]
            }
          ]
        ])
      ],
      ['g', new Map([['g', { policy: [roleValues] }]])]
    ])
  };
}

describe('adapter.js', () => {
  let knexAdapter;
  let database;
  let policies;

  beforeAll(async () => {
    database = knex({
      client: 'mysql'
    });
    mockKnex.mock(database);
    knexAdapter = await KnexAdapter.newAdapter(database);
    policies = database('policies');
  });

  /**
   * @bugfix: https://github.com/sarneeh/casbin-knex-adapter/issues/1
   * @fix adding ternary key checks to KnexAdapter.createPolicy(ptype, rule)
   */
  test('removePolicy (Bugfix: undefined v3, v4, v5 columns)', async () => {
    const mockPolicy = ['policyName', 'domain', 'object', 'permission'];
    const mockRole = ['userId', 'policyName', 'domain'];
    const mockPolicyAndRole = createMockPolicy(mockPolicy, mockRole);
    await knexAdapter.savePolicy(mockPolicyAndRole);

    // Error seemed to have happened when not passing all v0 - v5 values
    await knexAdapter.removePolicy('some string', ...['g', [...mockRole]]);
  });
});
