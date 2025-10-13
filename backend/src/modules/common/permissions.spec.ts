import { describe, expect, it } from 'vitest';

import { permissions } from './permissions.js';

describe('permissions matrix', () => {
  it('should expose admin permissions superset', () => {
    const adminPermissions = new Set(permissions.ADMINISTRADOR);
    Object.entries(permissions).forEach(([role, perms]) => {
      if (role === 'ADMINISTRADOR') {
        return;
      }
      perms.forEach((perm) => {
        expect(adminPermissions.has(perm)).toBe(true);
      });
    });
  });
});
