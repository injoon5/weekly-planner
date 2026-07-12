import type { InstantRules } from '@instantdb/react';

/**
 * Ownership via links. Create rules require the owner/board link in the same transaction
 * (see Instant docs: auth.id in data.ref('owner.id')).
 */
const rules = {
  attrs: {
    allow: {
      $default: 'false',
    },
  },
  boards: {
    allow: {
      view: "auth.id in data.ref('owner.id')",
      create: "auth.id != null && auth.id in data.ref('owner.id')",
      update: "auth.id in data.ref('owner.id')",
      delete: "auth.id in data.ref('owner.id')",
    },
  },
  events: {
    allow: {
      view: "auth.id in data.ref('board.owner.id')",
      create: "auth.id in data.ref('board.owner.id')",
      update: "auth.id in data.ref('board.owner.id')",
      delete: "auth.id in data.ref('board.owner.id')",
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
} satisfies InstantRules;

export default rules;
