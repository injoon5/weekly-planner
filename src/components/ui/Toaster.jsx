import { Toast } from '@base-ui/react/toast';
import * as stylex from '@stylexjs/stylex';
import { colors } from '../../tokens.stylex.js';

const s = stylex.create({
  pill: {
    backgroundColor: colors.chipBg,
    color: colors.chipFg,
    fontSize: '12px',
    fontWeight: 550,
    padding: '8px 14px',
    borderRadius: '99px',
    boxShadow: '0 8px 24px -6px rgba(0,0,0,.35)',
    cursor: 'default',
    userSelect: 'none',
  },

  desc: {
    margin: 0,
  },
});

const toastManager = Toast.createToastManager();

/** Show a transient status pill (replaces any pill currently visible). */
export function toast(msg) {
  toastManager.add({ description: msg, timeout: 2600 });
}

function Pills() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((t) => (
    <Toast.Root
      key={t.id}
      toast={t}
      swipeDirection={['down']}
      data-ui-toast=""
      {...stylex.props(s.pill)}
    >
      <Toast.Description {...stylex.props(s.desc)} />
    </Toast.Root>
  ));
}

/** Mount once at the app root. `toast()` works from anywhere. */
export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager} limit={1}>
      <Toast.Portal>
        <Toast.Viewport data-ui-toast-viewport="">
          <Pills />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
