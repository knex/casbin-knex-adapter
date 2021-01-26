import { Enforcer } from 'casbin';

export async function expectNotAuthorized(
  enforcer: Enforcer,
  v0: string,
  v1: string,
  v2: string,
  v3?: string
): Promise<void> {
  const checkResult = v3
    ? await enforcer.enforce(v0, v1, v2, v3)
    : await enforcer.enforce(v0, v1, v2);
  if (checkResult) {
    throw new Error('User is authorized');
  }
}

export async function expectAuthorized(
  enforcer: Enforcer,
  v0: string,
  v1: string,
  v2: string,
  v3?: string
): Promise<void> {
  const checkResult = v3
    ? await enforcer.enforce(v0, v1, v2, v3)
    : await enforcer.enforce(v0, v1, v2);
  if (!checkResult) {
    throw new Error('User is not authorized');
  }
}
