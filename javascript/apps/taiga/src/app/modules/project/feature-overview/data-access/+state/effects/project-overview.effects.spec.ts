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
import {
  InvitationMockFactory,
  MembershipMockFactory,
  ProjectMockFactory,
  UserMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import {
  fetchMembersSuccess,
  initMembers,
  nextMembersPage,
  onAcceptedInvitation,
} from '../actions/project-overview.actions';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { acceptInvitationSlugSuccess } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { randDomainSuffix } from '@ngneat/falso';
import { TestScheduler } from 'rxjs/testing';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/feature-overview/feature-overview.constants';

describe('ProjectOverviewEffects', () => {
  let actions$: Observable<Action>;
  let store: MockStore;
  let spectator: SpectatorService<ProjectOverviewEffects>;
  let testScheduler: TestScheduler;
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
    service: ProjectOverviewEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({
        initialState,
      }),
    ],
    imports: [],
    mocks: [ProjectApiService],
  });

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
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
      }),
    });

    expect(effects.initMembers$).toBeObservable(expected);
    expect(effects.initMembers$).toSatisfyOnFlush(() => {
      expect(projectApiService.getMembers).toHaveBeenCalledWith(
        project.slug,
        0
      );
      expect(projectApiService.getInvitations).toHaveBeenCalledWith(
        project.slug,
        0,
        MEMBERS_PAGE_SIZE
      );
    });
  });

  it('init members with enough members first load', () => {
    const project = ProjectMockFactory();

    project.userIsAdmin = true;

    store.overrideSelector(selectCurrentProject, project);

    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectOverviewEffects);

    const membershipResponse = {
      memberships: Array.from(Array(MEMBERS_PAGE_SIZE).keys()).map(() =>
        MembershipMockFactory()
      ),
      totalMemberships: 20,
    };

    const invitationsResponse = {
      invitations: undefined,
      totalInvitations: 20,
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
      }),
    });

    expect(effects.initMembers$).toBeObservable(expected);
    expect(effects.initMembers$).toSatisfyOnFlush(() => {
      expect(projectApiService.getMembers).toHaveBeenCalledWith(
        project.slug,
        0
      );
      expect(projectApiService.getInvitations).toHaveBeenCalledWith(
        project.slug,
        0,
        0
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
      };

      projectApiService.getMembers.mockReturnValue(
        cold('-b|', { b: membershipResponse })
      );

      actions$ = hot('-a', { a: nextMembersPage() });

      const expected = cold('--a', {
        a: fetchMembersSuccess({
          members: membershipResponse.memberships,
          totalMemberships: membershipResponse.totalMemberships,
        }),
      });

      expect(effects.nextMembersPage$).toBeObservable(expected);
      expect(effects.nextMembersPage$).toSatisfyOnFlush(() => {
        expect(projectApiService.getMembers).toHaveBeenCalledWith(
          project.slug,
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
        }),
      });

      expect(effects.nextMembersPage$).toBeObservable(expected);
      expect(effects.nextMembersPage$).toSatisfyOnFlush(() => {
        expect(projectApiService.getInvitations).toHaveBeenCalledWith(
          project.slug,
          MEMBERS_PAGE_SIZE
        );
      });
    });
  });

  it('Accepted Invitation', () => {
    const slug = randDomainSuffix({ length: 3 }).join('-');
    const user = UserMockFactory();
    const username = user.username;
    const effects = spectator.inject(ProjectOverviewEffects);

    testScheduler.run((helpers) => {
      const { hot, expectObservable } = helpers;
      actions$ = hot('-a', {
        a: acceptInvitationSlugSuccess({ projectSlug: slug, username }),
      });

      expectObservable(effects.acceptedInvitation$).toBe('701ms c', {
        c: onAcceptedInvitation({ onAcceptedInvitation: true }),
      });
    });
  });
});
