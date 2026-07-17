import { i } from '@instantdb/react';

/** Canonical Instant schema — also re-exported by `instant.schema.ts` for the CLI. */
const schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    boards: i.entity({
      name: i.string(),
      from: i.string().optional(),
      to: i.string().optional(),
      /** Repeat cadence in weeks anchored at `from` (0/absent = one-off). */
      repeatEvery: i.number().optional(),
      createdAt: i.number().indexed(),
      sortOrder: i.number().indexed(),
      colorLabels: i.string().optional(),
    }),
    events: i.entity({
      day: i.number().indexed(),
      title: i.string(),
      start: i.number().indexed(),
      dur: i.number(),
      color: i.string(),
      memo: i.string().optional(),
      createdAt: i.number().indexed(),
    }),
    settings: i.entity({
      theme: i.string().optional(),
      /** Presence/account display name; falls back to the email local part. */
      displayName: i.string().optional(),
      /** Presence avatar color override (hex); falls back to an email hash. */
      presenceColor: i.string().optional(),
    }),
    shares: i.entity({
      token: i.string().unique().indexed(),
      secret: i.string().indexed(),
      editSecret: i.string().indexed().optional(),
      mode: i.string(),
      role: i.string(),
      enabled: i.boolean(),
      createdAt: i.number().indexed(),
    }),
    members: i.entity({
      role: i.string().indexed(),
      email: i.string().optional(),
      createdAt: i.number().indexed(),
    }),
    boardPrefs: i.entity({
      hiddenColors: i.string().optional(),
      hideWeekend: i.boolean().optional(),
      compact: i.boolean().optional(),
      showMemos: i.boolean().optional(),
    }),
    /**
     * Ephemeral "checked today" marks for schedule events. One row per event
     * the user has ticked off, scoped to `day` (planner date, 06:00→06:00) and
     * `eventId`. The to-do list itself is derived from the board's events; a row
     * here only records that a given event is done *today*. Because the key is a
     * concrete date, the same weekly event starts unchecked again next week.
     */
    todos: i.entity({
      day: i.string().indexed(),
      eventId: i.string().indexed(),
      createdAt: i.number().indexed(),
    }),
    /**
     * Personal access tokens for the REST API (`/api/v1/*`). Only the SHA-256
     * hash is stored — the plaintext token is shown once at creation/rotation.
     * Rows are created/rotated server-side (`/api/tokens`); clients may list
     * and revoke their own (the `hash` field is never readable client-side).
     */
    apiTokens: i.entity({
      name: i.string().optional(),
      hash: i.string().unique().indexed(),
      /** First characters of the token, for display (`wp_ab12cd34`). */
      prefix: i.string(),
      createdAt: i.number().indexed(),
      lastUsedAt: i.number().optional(),
    }),
  },
  links: {
    boardOwner: {
      forward: {
        on: 'boards',
        has: 'one',
        label: 'owner',
        required: true,
        onDelete: 'cascade',
      },
      reverse: { on: '$users', has: 'many', label: 'boards' },
    },
    eventBoard: {
      forward: {
        on: 'events',
        has: 'one',
        label: 'board',
        required: true,
        onDelete: 'cascade',
      },
      reverse: { on: 'boards', has: 'many', label: 'events' },
    },
    settingsOwner: {
      forward: {
        on: 'settings',
        has: 'one',
        label: 'owner',
        required: true,
        onDelete: 'cascade',
      },
      reverse: { on: '$users', has: 'one', label: 'settings' },
    },
    shareBoard: {
      forward: {
        on: 'shares',
        has: 'one',
        label: 'board',
        required: true,
        onDelete: 'cascade',
      },
      reverse: { on: 'boards', has: 'many', label: 'shares' },
    },
    memberBoard: {
      forward: {
        on: 'members',
        has: 'one',
        label: 'board',
        required: true,
        onDelete: 'cascade',
      },
      reverse: { on: 'boards', has: 'many', label: 'members' },
    },
    memberUser: {
      forward: {
        on: 'members',
        has: 'one',
        label: 'user',
        required: true,
        onDelete: 'cascade',
      },
      reverse: { on: '$users', has: 'many', label: 'memberships' },
    },
    prefsBoard: {
      forward: {
        on: 'boardPrefs',
        has: 'one',
        label: 'board',
        required: true,
        onDelete: 'cascade',
      },
      reverse: { on: 'boards', has: 'many', label: 'prefs' },
    },
    prefsUser: {
      forward: {
        on: 'boardPrefs',
        has: 'one',
        label: 'user',
        required: true,
        onDelete: 'cascade',
      },
      reverse: { on: '$users', has: 'many', label: 'boardPrefs' },
    },
    boardEditors: {
      forward: {
        on: 'boards',
        has: 'many',
        label: 'editors',
      },
      reverse: { on: '$users', has: 'many', label: 'editableBoards' },
    },
    todoOwner: {
      forward: {
        on: 'todos',
        has: 'one',
        label: 'owner',
        required: true,
        onDelete: 'cascade',
      },
      reverse: { on: '$users', has: 'many', label: 'todos' },
    },
    apiTokenOwner: {
      forward: {
        on: 'apiTokens',
        has: 'one',
        label: 'owner',
        required: true,
        onDelete: 'cascade',
      },
      reverse: { on: '$users', has: 'many', label: 'apiTokens' },
    },
  },
  rooms: {
    board: {
      // Broadcast to everyone in the room (incl. anonymous share guests) —
      // display name only, never the raw email.
      presence: i.entity({
        name: i.string().optional(),
        color: i.string().optional(),
        role: i.string().optional(),
      }),
    },
  },
});

export default schema;
