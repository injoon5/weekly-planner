import { Dialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import * as stylex from '@stylexjs/stylex';
import { useMobileSheet } from '../../hooks/useMobileSheet.js';
import { ui } from '../../styles/ui.js';

/** Dialog on desktop; swipeable Drawer on mobile. */
function SheetRoot({ open, onOpenChange, children }) {
  const mobile = useMobileSheet();

  if (mobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange} swipeDirection="down">
        {children}
      </Drawer.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
}

function SheetPortal({ children }) {
  const mobile = useMobileSheet();
  return mobile ? <Drawer.Portal>{children}</Drawer.Portal> : <Dialog.Portal>{children}</Dialog.Portal>;
}

function SheetBackdrop(props) {
  const mobile = useMobileSheet();
  if (mobile) {
    return <Drawer.Backdrop data-ui-drawer-backdrop="" {...props} />;
  }
  return <Dialog.Backdrop data-ui-dialog-backdrop="" {...props} />;
}

function SheetViewport({ children }) {
  const mobile = useMobileSheet();
  if (mobile) {
    return <Drawer.Viewport data-ui-drawer-viewport="">{children}</Drawer.Viewport>;
  }
  return children;
}

function SheetPopup({ children, ...props }) {
  const mobile = useMobileSheet();

  if (mobile) {
    return (
      <Drawer.Popup data-ui-drawer="" {...props}>
        <span {...stylex.props(ui.drawerGrip)} aria-hidden="true" />
        <Drawer.Content>{children}</Drawer.Content>
      </Drawer.Popup>
    );
  }

  return (
    <Dialog.Popup data-ui-dialog="" {...props}>
      {children}
    </Dialog.Popup>
  );
}

function SheetTitle(props) {
  const mobile = useMobileSheet();
  return mobile ? <Drawer.Title {...props} /> : <Dialog.Title {...props} />;
}

function SheetClose(props) {
  const mobile = useMobileSheet();
  return mobile ? <Drawer.Close {...props} /> : <Dialog.Close {...props} />;
}

export const Sheet = {
  Root: SheetRoot,
  Portal: SheetPortal,
  Backdrop: SheetBackdrop,
  Viewport: SheetViewport,
  Popup: SheetPopup,
  Title: SheetTitle,
  Close: SheetClose,
};
