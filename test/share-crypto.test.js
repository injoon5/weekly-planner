import { describe, expect, it } from 'vitest';
import {
  SHARE_PBKDF2_ITERATIONS,
  hashSharePassword,
  hashSharePasswordLegacy,
  hashSharePasswordPbkdf2,
  randomShareSalt,
} from '../src/sharing/share.js';
import {
  SHARE_PASSWORD_MIN,
  buildShareDisable,
  buildShareSecrets,
  buildShareUpdate,
} from '../src/sharing/share-policy.js';

describe('share password crypto', () => {
  it('legacy hash is deterministic SHA-256(token:password)', async () => {
    const a = await hashSharePasswordLegacy('tok', 'secret');
    const b = await hashSharePassword('tok', 'secret');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain('secret');
  });

  it('PBKDF2 is deterministic for the same salt and differs across salts', async () => {
    const saltA = 'aa'.repeat(16);
    const saltB = 'bb'.repeat(16);
    const a1 = await hashSharePasswordPbkdf2('pw', saltA, SHARE_PBKDF2_ITERATIONS);
    const a2 = await hashSharePassword('tok', 'pw', saltA);
    const b = await hashSharePasswordPbkdf2('pw', saltB, SHARE_PBKDF2_ITERATIONS);
    expect(a1).toBe(a2);
    expect(a1).toMatch(/^[0-9a-f]{64}$/);
    expect(a1).not.toBe(b);
    expect(a1).not.toBe(await hashSharePasswordLegacy('tok', 'pw'));
  });

  it('randomShareSalt returns 32 hex chars', () => {
    const salt = randomShareSalt();
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(randomShareSalt()).not.toBe(salt);
  });

  it('buildShareSecrets password mode mints salt + PBKDF2 secret', async () => {
    const built = await buildShareSecrets({
      mode: 'password',
      role: 'viewer',
      password: 'hunter2',
      existingToken: 'AbCdEf12',
    });
    expect(built.passwordSalt).toMatch(/^[0-9a-f]{32}$/);
    expect(built.secret).toBe(
      await hashSharePasswordPbkdf2('hunter2', built.passwordSalt),
    );
    expect(built.secret).not.toBe(await hashSharePasswordLegacy('AbCdEf12', 'hunter2'));
  });

  it('buildShareUpdate keeps legacy secret when password unchanged', async () => {
    const fields = await buildShareUpdate({
      share: {
        token: 'tok',
        mode: 'password',
        role: 'viewer',
        secret: 'legacyhash',
        // no passwordSalt — legacy row
      },
      mode: 'password',
      role: 'viewer',
      password: '',
    });
    expect(fields.secret).toBe('legacyhash');
    expect(fields.passwordSalt).toBe(null);
  });

  it('rejects short share passwords on create and update', async () => {
    const short = 'x'.repeat(SHARE_PASSWORD_MIN - 1);
    await expect(
      buildShareSecrets({ mode: 'password', role: 'viewer', password: short }),
    ).rejects.toThrow();
    await expect(
      buildShareUpdate({
        share: { token: 'tok', mode: 'open', role: 'viewer', secret: 'tok' },
        mode: 'password',
        password: short,
      }),
    ).rejects.toThrow();
  });

  it('buildShareDisable scrambles the secret and drops editSecret', () => {
    const a = buildShareDisable();
    const b = buildShareDisable();
    expect(a.enabled).toBe(false);
    expect(a.editSecret).toBe(null);
    expect(a.secret).toMatch(/^revoked:/);
    // Never a valid token/hash again, and never reused across disables.
    expect(a.secret).not.toBe(b.secret);
  });

  it('buildShareUpdate open mode clears salt', async () => {
    const fields = await buildShareUpdate({
      share: {
        token: 'tok',
        mode: 'password',
        role: 'viewer',
        secret: 'x',
        passwordSalt: 'aa'.repeat(16),
      },
      mode: 'open',
      role: 'viewer',
    });
    expect(fields.secret).toBe('tok');
    expect(fields.passwordSalt).toBe(null);
  });
});
