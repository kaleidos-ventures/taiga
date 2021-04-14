import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromCore from './core.reducer';

export const selectCoreState = createFeatureSelector<fromCore.CoreState>(
  fromCore.coreFeatureKey
);

export const getGlobalLoading = createSelector(
  selectCoreState,
  (state: fromCore.CoreState) => state.loading
);
