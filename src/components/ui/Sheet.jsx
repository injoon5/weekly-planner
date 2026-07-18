import { Dialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import * as stylex from '@stylexjs/stylex';
import { createContext, useContext } from 'react';
import { useMobileSheet } from '../../hooks/useMobileSheet.js';
import { ui } from '../../styles/ui.js';

/** @typedef {'dialog' | 'rail'} SheetVariant */

const SheetVariantContext = createContext(/** @type {SheetVariant} */ ('dialog'));

function useSheetVariant() {
  return useContext(SheetVariantContext);
}

/** Dialog (or side-rail) on desktop; swipeable Drawer on mobile. */
export function SheetRoot({ open, onOpenChange, variant = 'dialog', children }) {
  const mobile = useMobileSheet();

  const tree = mobile ? (
    <Drawer.Root open={open} onOpenChange={onOpenChange} swipeDirection="down">
      {children}
    </Drawer.Root>
  ) : (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );

  return (
    <SheetVariantContext.Provider value={variant}>{tree}</SheetVariantContext.Provider>
  );
}

export function SheetPortal({ children }) {
  const mobile = useMobileSheet();
  return mobile ? <Drawer.Portal>{children}</Drawer.Portal> : <Dialog.Portal>{children}</Dialog.Portal>;
}

export function SheetBackdrop(props) {
  const mobile = useMobileSheet();
  const variant = useSheetVariant();
  if (mobile) {
    return <Drawer.Backdrop data-ui-drawer-backdrop="" {...props} />;
  }
  if (variant === 'rail') {
    return <Dialog.Backdrop data-ui-todos-backdrop="" {...props} />;
  }
  return <Dialog.Backdrop data-ui-dialog-backdrop="" {...props} />;
}

export function SheetViewport({ children }) {
  const mobile = useMobileSheet();
  if (mobile) {
    return <Drawer.Viewport data-ui-drawer-viewport="">{children}</Drawer.Viewport>;
  }
  return children;
}

export function SheetPopup({ children, ...props }) {
  const mobile = useMobileSheet();
  const variant = useSheetVariant();

  if (mobile) {
    return (
      <Drawer.Popup data-ui-drawer="" {...props}>
        <span {...stylex.props(ui.drawerGrip)} aria-hidden="true" />
        <Drawer.Content>{children}</Drawer.Content>
      </Drawer.Popup>
    );
  }

  if (variant === 'rail') {
    return (
      <Dialog.Popup data-ui-todos="" {...props}>
        {children}
      </Dialog.Popup>
    );
  }

  return (
    <Dialog.Popup data-ui-dialog="" {...props}>
      {children}
    </Dialog.Popup>
  );
}

export function SheetTitle(props) {
  const mobile = useMobileSheet();
  return mobile ? <Drawer.Title {...props} /> : <Dialog.Title {...props} />;
}

export function SheetClose(props) {
  const mobile = useMobileSheet();
  return mobile ? <Drawer.Close {...props} /> : <Dialog.Close {...props} />;
}
