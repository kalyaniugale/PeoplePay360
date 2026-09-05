import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.JWT_SECRET = 'test-only-jwt-secret-with-sufficient-length';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BOOTSTRAP_ADMIN_EMAIL = 'bootstrap@example.com';
process.env.BOOTSTRAP_ADMIN_PASSWORD = 'Bootstrap@123';
process.env.BOOTSTRAP_ADMIN_FIRST_NAME = 'Bootstrap';
process.env.BOOTSTRAP_ADMIN_LAST_NAME = 'Admin';

const { default: app } = await import('../src/app.js');
const { ROLES } = await import('../src/core/constants/roles.js');
const { ACCOUNT_STATUSES } = await import('../src/core/constants/statuses.js');
const { comparePassword, hashPassword } = await import('../src/core/security/password.js');
const { signAccessToken } = await import('../src/core/security/token.js');
const { AuthService } = await import('../src/modules/auth/auth.service.js');
const { BootstrapAdminService } = await import('../src/modules/users/bootstrapAdmin.service.js');
const { User } = await import('../src/modules/users/user.model.js');

const ids = {
  admin: '507f191e810c19729de860ea',
  employee: '507f191e810c19729de860eb',
  target: '507f191e810c19729de860ec',
};

const userRecord = (overrides = {}) => ({
  _id: ids.employee,
  uniqueId: 'PP360-U-00000001',
  firstName: 'Test',
  lastName: 'Employee',
  email: 'employee@example.com',
  role: ROLES.EMPLOYEE,
  accountStatus: ACCOUNT_STATUSES.ACTIVE,
  employeeId: null,
  mustChangePassword: false,
  ...overrides,
});

const withServer = async (run) => {
  const server = app.listen(0);
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

test('User model hides passwordHash and defines a unique email index', () => {
  const user = new User({
    ...userRecord(),
    passwordHash: 'must-not-appear',
  });
  const json = user.toJSON();

  assert.equal(User.schema.path('passwordHash').options.select, false);
  assert.equal(Object.hasOwn(json, 'passwordHash'), false);
  assert.ok(User.schema.indexes().some(([keys, options]) => keys.email === 1 && options.unique));
});

test('bootstrap creates one Admin with a hashed password and is idempotent', async (t) => {
  const admin = userRecord({
    _id: ids.admin,
    uniqueId: 'PP360-U-000001',
    firstName: 'Bootstrap',
    lastName: 'Admin',
    email: 'bootstrap@example.com',
    role: ROLES.ADMIN,
    mustChangePassword: true,
  });
  let lookupCount = 0;
  let upsertCount = 0;
  let capturedInsert;

  t.mock.method(User, 'findOne', async () => (lookupCount++ === 0 ? null : admin));
  t.mock.method(User, 'findOneAndUpdate', async (_filter, update) => {
    upsertCount += 1;
    capturedInsert = update.$setOnInsert;
    return admin;
  });

  const first = await BootstrapAdminService.provision();
  const second = await BootstrapAdminService.provision();

  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(upsertCount, 1);
  assert.notEqual(capturedInsert.passwordHash, process.env.BOOTSTRAP_ADMIN_PASSWORD);
  assert.equal(
    await comparePassword(process.env.BOOTSTRAP_ADMIN_PASSWORD, capturedInsert.passwordHash),
    true,
  );
});

test('login succeeds safely and wrong password or inactive account is rejected', async (t) => {
  const passwordHash = await hashPassword('Correct@123');
  let currentUser = userRecord({ passwordHash });

  t.mock.method(User, 'findOne', () => ({ select: async () => currentUser }));
  t.mock.method(User, 'findByIdAndUpdate', async () => currentUser);

  const result = await AuthService.login({ email: ' EMPLOYEE@EXAMPLE.COM ', password: 'Correct@123' });
  assert.ok(result.token);
  assert.equal(result.user.email, 'employee@example.com');
  assert.equal(Object.hasOwn(result.user, 'passwordHash'), false);

  await assert.rejects(
    AuthService.login({ email: 'employee@example.com', password: 'wrong-password' }),
    (error) => error.code === 'AUTH-001' && error.statusCode === 401,
  );

  currentUser = userRecord({ passwordHash, accountStatus: ACCOUNT_STATUSES.INACTIVE });
  await assert.rejects(
    AuthService.login({ email: 'employee@example.com', password: 'Correct@123' }),
    (error) => error.code === 'AUTH-004' && error.statusCode === 403,
  );
});

test('change-password validates current password and clears temporary-password state', async (t) => {
  const currentHash = await hashPassword('Current@123');
  const user = userRecord({ passwordHash: currentHash, mustChangePassword: true });
  let savedHash;

  t.mock.method(User, 'findById', () => ({ select: async () => user }));
  t.mock.method(User, 'findByIdAndUpdate', async (_id, update) => {
    savedHash = update.$set.passwordHash;
    return userRecord({ passwordHash: savedHash, mustChangePassword: false });
  });

  await assert.rejects(
    AuthService.changePassword({
      userId: ids.employee,
      currentPassword: 'wrong-password',
      newPassword: 'NewPassword@123',
    }),
    (error) => error.code === 'AUTH-001' && error.statusCode === 401,
  );

  await assert.rejects(
    AuthService.changePassword({
      userId: ids.employee,
      currentPassword: 'Current@123',
      newPassword: 'Current@123',
    }),
    (error) => error.code === 'USR-003' && error.statusCode === 422,
  );

  const changed = await AuthService.changePassword({
    userId: ids.employee,
    currentPassword: 'Current@123',
    newPassword: 'NewPassword@123',
  });
  assert.equal(changed.changed, true);
  assert.equal(changed.user.mustChangePassword, false);
  assert.equal(await comparePassword('NewPassword@123', savedHash), true);
});

test('JWT failures, safe /auth/me, and Employee denial use documented errors', async (t) => {
  const employee = userRecord();
  t.mock.method(User, 'findById', async () => employee);

  await withServer(async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.equal(missing.status, 401);
    assert.equal((await missing.json()).code, 'AUTH-002');

    const invalid = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { authorization: 'Bearer invalid' },
    });
    assert.equal(invalid.status, 401);
    assert.equal((await invalid.json()).code, 'AUTH-002');

    const token = signAccessToken(ids.employee);
    const me = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const meBody = await me.json();
    assert.equal(me.status, 200);
    assert.equal(meBody.data.id, ids.employee);
    assert.equal(Object.hasOwn(meBody.data, 'passwordHash'), false);

    const forbidden = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(forbidden.status, 403);
    assert.equal((await forbidden.json()).code, 'AUTH-003');
  });
});

test('Admin can create a user; duplicate email and invalid role are rejected', async (t) => {
  const admin = userRecord({ _id: ids.admin, role: ROLES.ADMIN, uniqueId: 'PP360-U-ADMIN001' });
  t.mock.method(User, 'findById', async () => admin);
  t.mock.method(User, 'exists', async ({ email }) => email === 'duplicate@example.com');
  t.mock.method(User, 'create', async (attributes) => userRecord(attributes));

  await withServer(async (baseUrl) => {
    const token = signAccessToken(ids.admin);
    const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
    const created = await fetch(`${baseUrl}/api/v1/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        firstName: 'Normal',
        lastName: 'User',
        email: 'NORMAL@EXAMPLE.COM',
        role: ROLES.EMPLOYEE,
      }),
    });
    const createdBody = await created.json();
    assert.equal(created.status, 201);
    assert.ok(createdBody.data.temporaryPassword);
    assert.equal(createdBody.data.user.email, 'normal@example.com');
    assert.equal(createdBody.data.user.mustChangePassword, true);
    assert.equal(Object.hasOwn(createdBody.data.user, 'passwordHash'), false);

    const duplicate = await fetch(`${baseUrl}/api/v1/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        firstName: 'Duplicate',
        lastName: 'User',
        email: 'duplicate@example.com',
        role: ROLES.EMPLOYEE,
      }),
    });
    assert.equal(duplicate.status, 409);
    assert.equal((await duplicate.json()).code, 'USR-001');

    const invalidRole = await fetch(`${baseUrl}/api/v1/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        firstName: 'Invalid',
        lastName: 'Role',
        email: 'invalid@example.com',
        role: 'SUPER_ADMIN',
      }),
    });
    assert.equal(invalidRole.status, 400);
    assert.equal((await invalidRole.json()).code, 'USR-002');
  });
});

test('Admin with a temporary password is restricted with AUTH-005', async (t) => {
  const admin = userRecord({
    _id: ids.admin,
    role: ROLES.ADMIN,
    mustChangePassword: true,
  });
  t.mock.method(User, 'findById', async () => admin);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { authorization: `Bearer ${signAccessToken(ids.admin)}` },
    });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, 'AUTH-005');
  });
});

test('Admin activate, deactivate, and reset-password actions update account security state', async (t) => {
  const admin = userRecord({ _id: ids.admin, role: ROLES.ADMIN });
  const target = userRecord({
    _id: ids.target,
    passwordHash: await hashPassword('OldPassword@123'),
    save: async function save() { return this; },
  });

  t.mock.method(User, 'findById', (id) => Promise.resolve(String(id) === ids.admin ? admin : target));

  await withServer(async (baseUrl) => {
    const headers = { authorization: `Bearer ${signAccessToken(ids.admin)}` };

    const deactivated = await fetch(`${baseUrl}/api/v1/users/${ids.target}/deactivate`, {
      method: 'POST', headers,
    });
    assert.equal(deactivated.status, 200);
    assert.equal((await deactivated.json()).data.accountStatus, ACCOUNT_STATUSES.INACTIVE);

    const activated = await fetch(`${baseUrl}/api/v1/users/${ids.target}/activate`, {
      method: 'POST', headers,
    });
    assert.equal(activated.status, 200);
    assert.equal((await activated.json()).data.accountStatus, ACCOUNT_STATUSES.ACTIVE);

    const reset = await fetch(`${baseUrl}/api/v1/users/${ids.target}/reset-password`, {
      method: 'POST', headers,
    });
    const resetBody = await reset.json();
    assert.equal(reset.status, 200);
    assert.equal(resetBody.data.user.mustChangePassword, true);
    assert.ok(resetBody.data.temporaryPassword);
    assert.equal(Object.hasOwn(resetBody.data.user, 'passwordHash'), false);
    assert.equal(await comparePassword(resetBody.data.temporaryPassword, target.passwordHash), true);
  });
});
