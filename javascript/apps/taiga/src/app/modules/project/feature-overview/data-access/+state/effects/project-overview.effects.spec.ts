/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';
import { ProjectApiService } from '@taiga/api';

import { ProjectOverviewEffects } from './project-overview.effects';
import { Action } from '@ngrx/store';
import { InvitationMockFactory, MembershipMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import {
  fetchMembersSuccess,
  initMembers,
} from '../actions/project-overview.actions';

describe('ProjectOverviewEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<ProjectOverviewEffects>;
  const createService = createServiceFactory({
    service: ProjectOverviewEffects,
    providers: [provideMockActions(() => actions$)],
    imports: [],
    mocks: [ProjectApiService],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('init members', () => {
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectOverviewEffects);

    const membershipResponse = [
      MembershipMockFactory(),
      MembershipMockFactory(),
    ];

    const invitationsResponse = [
      InvitationMockFactory(),
      InvitationMockFactory(),
    ];

    projectApiService.getMembers.mockReturnValue(
      cold('-b|', { b: membershipResponse })
    );
    projectApiService.getInvitations.mockReturnValue(
      cold('-b|', { b: invitationsResponse })
    );

    actions$ = hot('-a', { a: initMembers() });

    const expected = cold('--a', {
      a: fetchMembersSuccess({
        members: membershipResponse,
        invitations: invitationsResponse,
      }),
    });

    expect(effects.initMembers$).toBeObservable(expected);
  });
});
