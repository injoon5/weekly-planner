import { createContext } from 'react';

export const AppUpdateContext = createContext({
  needRefresh: false,
  dismiss: () => {},
  refresh: () => {},
});
