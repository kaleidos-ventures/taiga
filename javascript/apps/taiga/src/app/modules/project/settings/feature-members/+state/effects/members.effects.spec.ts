/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Router } from '@angular/router';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { InvitationApiService, ProjectApiService } from '@taiga/api';
import {
  InvitationMockFactory,
  MembershipMockFactory,
  ProjectMockFactory
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { AppService } from '~/app/services/app.service';
import {
  fetchInvitationsSuccess,
  fetchMembersSuccess,
  setMembersPage,
  setPendingPage
} from '../actions/members.actions';
import { MembersEffects } from './members.effects';

describe('MembersEffects', () => {
  let actions$: Observable<Action>;
  let store: MockStore;
  let spectator: SpectatorService<MembersEffects>;

  const initialState = {
    overview: {
      members: [],
      invitations: [],
      totalInvitations: 0,
      totalMemberships: 0,
      hasMoreMembers: true,
      hasMoreInvitations: true,
    },
  };

  const createService = createServiceFactory({
    service: MembersEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({
        initialState,
      }),
    ],
    imports: [],
    mocks: [ProjectApiService, AppService, Router, InvitationApiService],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  it('next members page', () => {
    const project = ProjectMockFactory();

    store.overrideSelector(selectCurrentProject, project);

    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(MembersEffects);

    const membershipResponse = {
      memberships: [MembershipMockFactory(), MembershipMockFactory()],
      totalMemberships: 2,
    };

    projectApiService.getMembers.mockReturnValue(
      cold('-b|', { b: membershipResponse })
    );

    actions$ = hot('-a', { a: setMembersPage({ offset: 0 }) });

    const expected = cold('--a', {
      a: fetchMembersSuccess({
        members: membershipResponse.memberships,
        totalMemberships: membershipResponse.totalMemberships,
        offset: 0,
      }),
    });

    expect(effects.nextMembersPage$).toBeObservable(expected);
    expect(effects.nextMembersPage$).toSatisfyOnFlush(() => {
      expect(projectApiService.getMembers).toHaveBeenCalledWith(
        project.slug,
        0,
        20
      );
    });
  });

  it('next invitations page', () => {
    const project = ProjectMockFactory();

    store.overrideSelector(selectCurrentProject, project);

    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(MembersEffects);

    const invitationsResponse = {
      invitations: [InvitationMockFactory(), InvitationMockFactory()],
      totalInvitations: 2,
    };

    projectApiService.getInvitations.mockReturnValue(
      cold('-b|', { b: invitationsResponse })
    );

    actions$ = hot('-a', { a: setPendingPage({ offset: 0 }) });

    const expected = cold('--a', {
      a: fetchInvitationsSuccess({
        invitations: invitationsResponse.invitations,
        totalInvitations: invitationsResponse.totalInvitations,
        offset: 0,
      }),
    });

    expect(effects.nextPendingPage$).toBeObservable(expected);
    expect(effects.nextPendingPage$).toSatisfyOnFlush(() => {
      expect(projectApiService.getInvitations).toHaveBeenCalledWith(
        project.slug,
        0,
        20
      );
    });
  });
});
