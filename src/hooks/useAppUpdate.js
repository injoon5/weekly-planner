import { useContext } from 'react';
import { AppUpdateContext } from './app-update-context.js';

export function useAppUpdate() {
  return useContext(AppUpdateContext);
}
