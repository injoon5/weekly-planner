import { useEffect, useRef, useState } from 'react';
import { eventFields } from '../board/models.js';

// Must outlast the dialog's CSS exit transition (base-ui.css: .18s / .22s sheet).
const CLOSE_MS = 260;

/**
 * Draft-until-save session.
 * Policy: Done/Enter = save; X / scrim / Escape / Cancel = discard; Delete = hold-confirm only.
 * Persist runs outside setState (Strict Mode safe).
 */
export function useEditorSession({ events, eventsApi }) {
  const [editing, setEditing] = useState(null);
  const eventsRef = useRef(events);
  const editingRef = useRef(null);
  const closeTimer = useRef(0);
  const isCommittingRef = useRef(false);

  eventsRef.current = events;
  editingRef.current = editing;

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const openCreate = (draft) => {
    setEditing({ mode: 'create', draft: eventFields(draft), closing: false });
  };

  const openEdit = (eid) => {
    const ev = eventsRef.current.find((e) => e.id === eid);
    if (!ev) return;
    const { id: _id, ...fields } = ev;
    setEditing({ mode: 'edit', id: eid, draft: eventFields(fields), closing: false });
  };

  const closeEditor = async (action, draft) => {
    const ed = editingRef.current;
    if (!ed || ed.closing || isCommittingRef.current) return;

    if (action === 'save') {
      isCommittingRef.current = true;
      const fields = eventFields(draft || ed.draft);
      const didSave =
        ed.mode === 'create'
          ? Boolean(await eventsApi.createEvent(fields))
          : Boolean(ed.id && (await eventsApi.saveEvent(ed.id, fields)));
      isCommittingRef.current = false;
      if (!didSave) return;
    } else if (action === 'delete' && ed.mode === 'edit' && ed.id) {
      isCommittingRef.current = true;
      const didDelete = await eventsApi.removeEvent(ed.id);
      isCommittingRef.current = false;
      if (!didDelete) return;
    }

    const closing = { ...ed, closing: true };
    editingRef.current = closing;
    setEditing(closing);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      editingRef.current = null;
      setEditing(null);
    }, CLOSE_MS);
  };

  const save = (draft) => void closeEditor('save', draft);
  const cancel = () => void closeEditor('cancel');
  const deleteEvent = () => void closeEditor('delete');

  return {
    editing,
    openCreate,
    openEdit,
    save,
    cancel,
    deleteEvent,
  };
}
