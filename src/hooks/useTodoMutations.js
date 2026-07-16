import {
  createTodoTx,
  db,
  deleteTodoTx,
  patchEventTx,
  patchTodoTx,
} from '../db.js';
import { commitTransaction } from '../transaction.js';

/** Day checklist mutations — event done + freeform todos. */
export function useTodoMutations({ board, canEdit = true, ruleParams = null, onError }) {
  const transact = async (tx, message) => {
    return await commitTransaction((transaction) => db.transact(transaction), tx, {
      message,
      onError,
    });
  };

  const toggleEventDone = async (eid, done) => {
    if (!canEdit) return false;
    const tx = patchEventTx(eid, { done: Boolean(done) }, ruleParams);
    if (!tx) return true;
    return await transact(tx, '체크를 반영하지 못했어요');
  };

  const addTodo = async ({ day, text, sortOrder }) => {
    if (!canEdit || !board) return null;
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!trimmed) return null;
    const { tid, tx } = createTodoTx(board.id, { day, text: trimmed, sortOrder }, ruleParams);
    const didCreate = await transact(tx, '할 일을 추가하지 못했어요');
    return didCreate ? tid : null;
  };

  const toggleTodoDone = async (tid, done) => {
    if (!canEdit) return false;
    const tx = patchTodoTx(tid, { done: Boolean(done) }, ruleParams);
    if (!tx) return true;
    return await transact(tx, '체크를 반영하지 못했어요');
  };

  const removeTodo = async (tid) => {
    if (!canEdit) return false;
    return await transact(deleteTodoTx(tid, ruleParams), '할 일을 삭제하지 못했어요');
  };

  return { toggleEventDone, addTodo, toggleTodoDone, removeTodo };
}
