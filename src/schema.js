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
      createdAt: i.number().indexed(),
      sortOrder: i.number().indexed(),
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
  },
});

export default schema;
