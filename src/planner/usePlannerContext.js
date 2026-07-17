import { useContext } from 'react';
import { PlannerContext } from './planner-context.js';

export function usePlannerContext() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlannerContext must be used within PlannerProvider');
  return ctx;
}
