import { useEffect, useRef, useState } from 'react';
import { db, saveEventTx } from '../db.js';
import { eventFields } from '../models.js';

// Must outlast the dialog's CSS exit transition (base-ui.css: .18s / .22s sheet).
const CLOSE_MS = 260;

/**
 * Draft-until-save session.
 * Policy: Done/Enter = save; X / scrim / Escape / Cancel = discard; Delete = hold-confirm only.
 * Persist runs outside setState (Strict Mode safe).
 */
export function useEditorSession({ events, createEvent, removeEvent, ruleParams = null }) {
  const [editing, setEditing] = useState(null);
  const eventsRef = useRef(events);
  const editingRef = useRef(null);
  const closeTimer = useRef(0);
  const ruleParamsRef = useRef(ruleParams);

  eventsRef.current = events;
  editingRef.current = editing;
  ruleParamsRef.current = ruleParams;

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

  const closeEditor = (action, draft) => {
    const ed = editingRef.current;
    if (!ed || ed.closing) return;

    if (action === 'save') {
      const fields = eventFields(draft || ed.draft);
      if (ed.mode === 'create') createEvent(fields);
      else if (ed.id) {
        const tx = saveEventTx(ed.id, fields, ruleParamsRef.current);
        if (tx) db.transact(tx);
      }
    } else if (action === 'delete' && ed.mode === 'edit' && ed.id) {
      removeEvent(ed.id);
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

  const save = (draft) => closeEditor('save', draft);
  const cancel = () => closeEditor('cancel');
  const deleteEvent = () => closeEditor('delete');

  return {
    editing,
    openCreate,
    openEdit,
    save,
    cancel,
    deleteEvent,
  };
}
