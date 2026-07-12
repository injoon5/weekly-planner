import { useEffect, useRef, useState } from 'react';
import { db, saveEventTx } from '../db.js';
import { eventFields } from '../models.js';

/**
 * Draft-until-save session.
 * Policy: Done/Enter = save; X / scrim / Escape / Cancel = discard; Delete = hold-confirm only.
 */
export function useEditorSession({ events, createEvent, removeEvent }) {
  const [editing, setEditing] = useState(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

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
    setEditing((ed) => {
      if (!ed || ed.closing) return ed;
      if (action === 'save') {
        const fields = eventFields(draft || ed.draft);
        if (ed.mode === 'create') createEvent(fields);
        else if (ed.id) {
          const tx = saveEventTx(ed.id, fields);
          if (tx) db.transact(tx);
        }
      } else if (action === 'delete' && ed.mode === 'edit' && ed.id) {
        removeEvent(ed.id);
      }
      // cancel / discard: no persist
      setTimeout(() => setEditing(null), 200);
      return { ...ed, closing: true };
    });
  };

  const save = (draft) => closeEditor('save', draft);
  const cancel = () => closeEditor('cancel');
  const deleteEvent = () => closeEditor('delete');

  useEffect(() => {
    if (!editing || editing.closing) return;
    const onKey = (e) => {
      if (e.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing]);

  return {
    editing,
    openCreate,
    openEdit,
    save,
    cancel,
    deleteEvent,
  };
}
