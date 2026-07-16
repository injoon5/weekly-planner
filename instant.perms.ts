import type { InstantRules } from '@instantdb/react';

/**
 * Ownership, membership, and secret share links.
 * Share guests pass ruleParams.secret (open token or password hash).
 * Share metadata lookup uses ruleParams.shareToken (== shares.token).
 * linkedGuestUsers: after a guest upgrades into an existing email, the primary
 * account can still read/update data owned by the linked guest until transfer.
 */
const rules = {
  attrs: {
    allow: {
      $default: 'false',
    },
  },
  boards: {
    allow: {
      view: 'isOwner || isMember || isGuestOwner || hasShareSecret',
      create: "auth.id != null && auth.id in data.ref('owner.id')",
      update: 'isOwner || isGuestOwner',
      delete: 'isOwner',
    },
    bind: {
      isOwner: "auth.id in data.ref('owner.id')",
      isGuestOwner: "data.ref('owner.id')[0] in auth.ref('$user.linkedGuestUsers.id')",
      isMember: "auth.id in data.ref('members.user.id')",
      isEditor: "auth.id in data.ref('editors.id')",
      hasShareSecret:
        "true in data.ref('shares.enabled') && ruleParams.secret in data.ref('shares.secret')",
    },
  },
  events: {
    allow: {
      view: 'isBoardOwner || isBoardMember || isBoardGuestOwner || hasBoardShareSecret',
      create: 'isBoardOwner || isBoardEditor || isBoardGuestOwner || hasBoardEditSecret',
      update: 'isBoardOwner || isBoardEditor || isBoardGuestOwner || hasBoardEditSecret',
      delete: 'isBoardOwner || isBoardEditor || hasBoardEditSecret',
    },
    bind: {
      isBoardOwner: "auth.id in data.ref('board.owner.id')",
      isBoardGuestOwner:
        "data.ref('board.owner.id')[0] in auth.ref('$user.linkedGuestUsers.id')",
      isBoardMember: "auth.id in data.ref('board.members.user.id')",
      isBoardEditor: "auth.id in data.ref('board.editors.id')",
      hasBoardShareSecret:
        "true in data.ref('board.shares.enabled') && ruleParams.secret in data.ref('board.shares.secret')",
      hasBoardEditSecret:
        "true in data.ref('board.shares.enabled') && ruleParams.secret in data.ref('board.shares.editSecret')",
    },
  },
  settings: {
    allow: {
      view: "auth.id in data.ref('owner.id') || data.ref('owner.id')[0] in auth.ref('$user.linkedGuestUsers.id')",
      create: "auth.id != null && auth.id in data.ref('owner.id')",
      update:
        "auth.id in data.ref('owner.id') || data.ref('owner.id')[0] in auth.ref('$user.linkedGuestUsers.id')",
      delete: "auth.id in data.ref('owner.id')",
    },
  },
  shares: {
    allow: {
      view: 'isTokenLookup || isBoardOwner || isBoardGuestOwner',
      create: 'isBoardOwner',
      update: 'isBoardOwner',
      delete: 'isBoardOwner',
    },
    bind: {
      isBoardOwner: "auth.id in data.ref('board.owner.id')",
      isBoardGuestOwner:
        "data.ref('board.owner.id')[0] in auth.ref('$user.linkedGuestUsers.id')",
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
      view: 'isSelf || isLinkedGuestSelf',
      create: "auth.id != null && auth.id in data.ref('user.id')",
      update: 'isSelf || isLinkedGuestSelf',
      delete: 'isSelf',
    },
    bind: {
      isSelf: "auth.id in data.ref('user.id')",
      isLinkedGuestSelf: "data.ref('user.id')[0] in auth.ref('$user.linkedGuestUsers.id')",
    },
  },
} satisfies InstantRules;

export default rules;
