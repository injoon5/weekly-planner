import type { InstantRules } from '@instantdb/react';

/**
 * Ownership, membership, and secret share links.
 * Share guests pass ruleParams.secret (open token or password hash).
 * Share metadata lookup uses ruleParams.shareToken (== shares.token).
 */
const rules = {
  attrs: {
    allow: {
      $default: 'false',
    },
  },
  boards: {
    allow: {
      view: 'isOwner || isMember || hasShareSecret',
      create: "auth.id != null && auth.id in data.ref('owner.id')",
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: {
      isOwner: "auth.id in data.ref('owner.id')",
      isMember: "auth.id in data.ref('members.user.id')",
      hasShareSecret:
        "true in data.ref('shares.enabled') && ruleParams.secret in data.ref('shares.secret')",
    },
  },
  events: {
    allow: {
      view: 'isBoardOwner || isBoardMember || hasBoardShareSecret',
      // Signed-in writers consume a rate-limit token; share-link guests
      // (auth.id == null) are keyed by their share secret instead. `limit`
      // goes last in the && chain so denied writes never consume tokens.
      create: '(isBoardOwner || isBoardEditor || hasBoardEditSecret) && canSpendWrite',
      update: '(isBoardOwner || isBoardEditor || hasBoardEditSecret) && canSpendWrite',
      delete: '(isBoardOwner || isBoardEditor || hasBoardEditSecret) && canSpendWrite',
    },
    bind: {
      isBoardOwner: "auth.id in data.ref('board.owner.id')",
      isBoardMember: "auth.id in data.ref('board.members.user.id')",
      isBoardEditor: "auth.id in data.ref('board.editors.id')",
      hasBoardShareSecret:
        "true in data.ref('board.shares.enabled') && ruleParams.secret in data.ref('board.shares.secret')",
      hasBoardEditSecret:
        "true in data.ref('board.shares.enabled') && ruleParams.secret in data.ref('board.shares.editSecret')",
      canSpendWrite:
        'auth.id != null ? rateLimit.eventWrites.limit(auth.id) : rateLimit.eventWrites.limit(ruleParams.secret)',
    },
  },
  settings: {
    allow: {
      view: "auth.id in data.ref('owner.id')",
      create: "auth.id != null && auth.id in data.ref('owner.id')",
      update: "auth.id in data.ref('owner.id')",
      delete: "auth.id in data.ref('owner.id')",
    },
  },
  shares: {
    allow: {
      view: 'isTokenLookup || isBoardOwner',
      create: 'isBoardOwner',
      update: 'isBoardOwner',
      delete: 'isBoardOwner',
    },
    bind: {
      isBoardOwner: "auth.id in data.ref('board.owner.id')",
      isTokenLookup: 'data.token == ruleParams.shareToken',
    },
    fields: {
      secret: "auth.id in data.ref('board.owner.id')",
      editSecret: "auth.id in data.ref('board.owner.id')",
    },
  },
  members: {
    allow: {
      view: 'isBoardOwner || isSelf',
      create: 'isBoardOwner',
      update: 'isBoardOwner',
      delete: 'isBoardOwner || isSelf',
    },
    bind: {
      isBoardOwner: "auth.id in data.ref('board.owner.id')",
      isSelf: "auth.id in data.ref('user.id')",
    },
  },
  boardPrefs: {
    allow: {
      view: 'isSelf',
      create: "auth.id != null && auth.id in data.ref('user.id')",
      update: 'isSelf',
      delete: 'isSelf',
    },
    bind: {
      isSelf: "auth.id in data.ref('user.id')",
    },
  },
  todos: {
    allow: {
      view: 'isOwner',
      create:
        "auth.id != null && auth.id in data.ref('owner.id') && rateLimit.todoWrites.limit(auth.id)",
      update: 'isOwner',
      delete: 'isOwner',
    },
    bind: {
      isOwner: "auth.id in data.ref('owner.id')",
    },
  },
  /**
   * REST API personal access tokens. Created and rotated only server-side
   * (`/api/tokens`, admin SDK bypasses these rules); clients may list and
   * revoke their own rows but can never read or write the secret hash.
   */
  apiTokens: {
    allow: {
      view: 'isOwner',
      create: 'false',
      update: 'false',
      delete: 'isOwner',
    },
    bind: {
      isOwner: "auth.id in data.ref('owner.id')",
    },
    fields: {
      hash: 'false',
    },
  },
} satisfies InstantRules;

/**
 * Token buckets for the rules above — https://www.instantdb.com/docs/rate-limits
 * Limits are per entity (a transaction touching N rows spends N tokens), so
 * capacities are sized well above interactive use: they only stop runaway
 * scripts and abusive REST clients, never a human dragging events around.
 * (Typed separately: `InstantRules` in @instantdb 0.22.x predates `$rateLimits`.)
 */
const rateLimits = {
  $rateLimits: {
    eventWrites: {
      limits: [
        // Burst: 120 event writes/minute; sustained: 2000/day.
        { capacity: 120, refill: { period: '1 minute' } },
        { capacity: 2000, refill: { period: '24 hours' } },
      ],
    },
    todoWrites: {
      limits: [{ capacity: 300, refill: { period: '1 hour' } }],
    },
  },
};

export default { ...rules, ...rateLimits };
