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
import { ProjectApiService } from '@taiga/api';
import {
  InvitationMockFactory,
  MembershipMockFactory,
  ProjectMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/feature-overview/feature-overview.constants';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import {
  fetchMembersSuccess,
  initMembers,
  nextMembersPage,
} from '../actions/project-overview.actions';
import { ProjectOverviewEffects } from './project-overview.effects';

describe('ProjectOverviewEffects', () => {
  let actions$: Observable<Action>;
  let store: MockStore;
  let spectator: SpectatorService<ProjectOverviewEffects>;

  const initialState = {
    overview: {
      members: [],
      invitations: [],
      totalInvitations: 0,
      totalMemberships: 0,
      hasMoreMembers: true,
      hasMoreInvitations: true,
      showAllMembers: false,
    },
  };

  const createService = createServiceFactory({
    service: ProjectOverviewEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({
        initialState,
      }),
    ],
    imports: [getTranslocoModule()],
    mocks: [ProjectApiService, Router],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  it('init members', () => {
    const project = ProjectMockFactory();

    project.userIsAdmin = true;

    store.overrideSelector(selectCurrentProject, project);

    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectOverviewEffects);

    const membershipResponse = {
      memberships: [MembershipMockFactory(), MembershipMockFactory()],
      totalMemberships: 2,
    };

    const invitationsResponse = {
      invitations: [InvitationMockFactory(), InvitationMockFactory()],
      totalInvitations: 2,
    };

    projectApiService.getMembers.mockReturnValue(
      cold('-b|', { b: membershipResponse })
    );
    projectApiService.getInvitations.mockReturnValue(
      cold('-b|', { b: invitationsResponse })
    );

    actions$ = hot('-a', { a: initMembers() });

    const expected = cold('---a', {
      a: fetchMembersSuccess({
        members: membershipResponse.memberships,
        totalMemberships: membershipResponse.totalMemberships,
        invitations: invitationsResponse.invitations,
        totalInvitations: invitationsResponse.totalInvitations,
        showAllMembers: false,
      }),
    });

    expect(effects.initMembers$).toBeObservable(expected);
    expect(effects.initMembers$).toSatisfyOnFlush(() => {
      expect(projectApiService.getMembers).toHaveBeenCalledWith(project.id, 0);
      expect(projectApiService.getInvitations).toHaveBeenCalledWith(
        project.id,
        0,
        MEMBERS_PAGE_SIZE
      );
    });
  });

  describe('paginate', () => {
    it('members', () => {
      const project = ProjectMockFactory();

      project.userIsAdmin = true;

      store.overrideSelector(selectCurrentProject, project);

      const projectApiService = spectator.inject(ProjectApiService);
      const effects = spectator.inject(ProjectOverviewEffects);

      const membershipResponse = {
        memberships: Array(MEMBERS_PAGE_SIZE).map(() =>
          MembershipMockFactory()
        ),
        totalMemberships: MEMBERS_PAGE_SIZE,
        showAllMembers: false,
      };

      projectApiService.getMembers.mockReturnValue(
        cold('-b|', { b: membershipResponse })
      );

      actions$ = hot('-a', { a: nextMembersPage() });

      const expected = cold('--a', {
        a: fetchMembersSuccess({
          members: membershipResponse.memberships,
          totalMemberships: membershipResponse.totalMemberships,
          showAllMembers: false,
        }),
      });

      expect(effects.nextMembersPage$).toBeObservable(expected);
      expect(effects.nextMembersPage$).toSatisfyOnFlush(() => {
        expect(projectApiService.getMembers).toHaveBeenCalledWith(
          project.id,
          0
        );
      });
    });

    it('invitations', () => {
      const project = ProjectMockFactory();

      project.userIsAdmin = true;

      store.overrideSelector(selectCurrentProject, project);

      const projectApiService = spectator.inject(ProjectApiService);
      const effects = spectator.inject(ProjectOverviewEffects);

      store.setState({
        overview: {
          members: [],
          invitations: Array(MEMBERS_PAGE_SIZE).map(() =>
            InvitationMockFactory()
          ),
          totalInvitations: 10,
          totalMemberships: 0,
          hasMoreMembers: false,
          hasMoreInvitations: true,
          showAllMembers: true,
        },
      });

      const invitationsResponse = {
        invitations: Array(MEMBERS_PAGE_SIZE).map(() =>
          InvitationMockFactory()
        ),
        totalInvitations: 10,
      };

      projectApiService.getInvitations.mockReturnValue(
        cold('-b|', { b: invitationsResponse })
      );

      actions$ = hot('-a', { a: nextMembersPage() });

      const expected = cold('--a', {
        a: fetchMembersSuccess({
          invitations: invitationsResponse.invitations,
          totalInvitations: invitationsResponse.totalInvitations,
          showAllMembers: true,
        }),
      });

      expect(effects.nextMembersPage$).toBeObservable(expected);
      expect(effects.nextMembersPage$).toSatisfyOnFlush(() => {
        expect(projectApiService.getInvitations).toHaveBeenCalledWith(
          project.id,
          MEMBERS_PAGE_SIZE
        );
      });
    });
  });
});
