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
      /** Checked off in the day checklist panel. */
      done: i.boolean().optional(),
      createdAt: i.number().indexed(),
    }),
    todos: i.entity({
      day: i.number().indexed(),
      text: i.string(),
      done: i.boolean().optional(),
      sortOrder: i.number().indexed(),
      createdAt: i.number().indexed(),
    }),
    settings: i.entity({
      theme: i.string().optional(),
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
    todoBoard: {
      forward: {
        on: 'todos',
        has: 'one',
        label: 'board',
        required: true,
        onDelete: 'cascade',
      },
      reverse: { on: 'boards', has: 'many', label: 'todos' },
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
