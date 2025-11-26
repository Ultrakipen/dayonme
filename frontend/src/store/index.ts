import { StoreProvider, useStore } from './StoreContext';
import { actions } from './actions';
import { AppState, Action, ActionType } from './types';

export {
  StoreProvider,
  useStore,
  actions,
  ActionType
};

export type { AppState, Action };

export default {
  StoreProvider,
  useStore,
  actions,
};