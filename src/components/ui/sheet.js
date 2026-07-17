import {
  SheetBackdrop,
  SheetClose,
  SheetPopup,
  SheetPortal,
  SheetRoot,
  SheetTitle,
  SheetViewport,
} from './Sheet.jsx';

/** Compound namespace for sheet parts (kept out of the component module for Fast Refresh). */
export const Sheet = {
  Root: SheetRoot,
  Portal: SheetPortal,
  Backdrop: SheetBackdrop,
  Viewport: SheetViewport,
  Popup: SheetPopup,
  Title: SheetTitle,
  Close: SheetClose,
};
