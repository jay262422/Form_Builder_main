const { userCanAccessForm } = require('../utils/workspaceHelper');
const { sanitizeValue } = require('../utils/sanitizeInput');

describe('form access', () => {
  test('allows a member of the same workspace', () => {
    const form = { workspaceId: 'workspace-a', userId: 'owner' };
    expect(userCanAccessForm(form, { _id: 'member', workspaceId: 'workspace-a' })).toBe(true);
  });

  test('blocks a user from another workspace', () => {
    const form = { workspaceId: 'workspace-a', userId: 'owner' };
    expect(userCanAccessForm(form, { _id: 'stranger', workspaceId: 'workspace-b' })).toBe(false);
  });

  test('blocks a user with no workspace from a workspace form', () => {
    const form = { workspaceId: 'workspace-a', userId: 'owner' };
    expect(userCanAccessForm(form, { _id: 'stranger', workspaceId: null })).toBe(false);
  });

  test('allows the owner of a form that has no workspace', () => {
    const form = { workspaceId: null, userId: 'owner' };
    expect(userCanAccessForm(form, { _id: 'owner', workspaceId: null })).toBe(true);
  });
});

describe('request sanitizing', () => {
  test('drops query operator keys', () => {
    expect(sanitizeValue({ name: 'Ada', $gt: '', nested: { $ne: 1, ok: true } })).toEqual({
      name: 'Ada',
      nested: { ok: true }
    });
  });
});
