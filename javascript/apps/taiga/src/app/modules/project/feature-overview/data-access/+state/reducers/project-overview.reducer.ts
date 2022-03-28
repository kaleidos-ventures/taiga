/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createFeature, createReducer, on } from '@ngrx/store';
import { immerReducer } from '~/app/shared/utils/store';
import { Invitation, Membership } from '@taiga/data';
import * as ProjectOverviewActions from '../actions/project-overview.actions';

export interface ProjectOverviewState {
  members: Membership[];
  invitations: Invitation[];
}

export const initialState: ProjectOverviewState = {
  members: [],
  invitations: [],
};

export const reducer = createReducer(
  initialState,
  on(
    ProjectOverviewActions.initProjectOverview,
    (state): ProjectOverviewState => {
      state.members = [];
      state.invitations = [];

      return state;
    }
  ),
  on(
    ProjectOverviewActions.fetchMembersSuccess,
    (state, { members, invitations }): ProjectOverviewState => {
      state.members = members;
      state.invitations = invitations;

      return state;
    }
  )
);

export const projectOverviewFeature = createFeature({
  name: 'overview',
  reducer: immerReducer(reducer),
});
