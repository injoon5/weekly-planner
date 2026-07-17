import { Toast } from '@base-ui/react/toast';

export const toastManager = Toast.createToastManager();

/** Show a transient status pill (replaces any pill currently visible). */
export function toast(msg) {
  toastManager.add({ description: msg, timeout: 2600 });
}
